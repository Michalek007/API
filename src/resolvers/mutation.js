const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const {
    AuthenticationError,
    ForbiddenErorr
} = require('apollo-server-express');
require('dotenv').config();

const gravatar = require('../util/gravatar');
module.exports = {
    signIn: async (parent, {username, email, password }, { models }) => {
        if (email) {
            email = email.trim().toLowerCase();
        }
        const user = await models.User.findOne({
            $or: [{ email }, { username }]
        });
        if (!user) {
            throw new AuthenticationError('Błąd podczas uwierzytelniania.');
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            throw new AuthenticationError('Błąd podczas uwierzytelniania.');
        }
        return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    },
    signUp: async (parent, {username, email, password }, { models }) => {
        email = email.trim().toLowerCase();
        const hashed = await bcrypt.hash(password,10);
        const avatar = gravatar(email);
        try {
            const user = await models.User.create({
                username,
                email,
                avatar,
                password: hashed
            });
            return jwt.sign({id: user._id }, process.env.JWT_SECRET);
        } catch (err) {
            console.log(err);
            throw new Error('piwo nie może zostać wypite');
        }
    },
    newNote: async(parent,args, {models, user}) => {
        if (!user){
            throw new AuthenticationError('Tylko zalogowani użytkownicy mogą tworzyć notatki.');
        }
        return await models.Note.create({
            content: args.content,
            author: mongoose.Types.ObjectId(user.id)
        });
    },
    deleteNote: async(parent,{id}, {models, user}) => {
        if (!user){
            throw new AuthenticationError('Tylko zalogowani użytkownicy mogą usuwać notatki.');
        }
        const note = await models.Note.findById(id);
        if (note && String(note.author) !== user.id){
            throw new ForbiddenErorr("Nie masz uprawnień do usunięcia notatki.");
        }
        try {
            await note.remove();
            return true;
        } catch (err) {
            return false;
        }
    },
    updateNote: async(parent, {content, id}, {models, user}) => {
        if (!user){
            throw new AuthenticationError('Tylko zalogowani użytkownicy mogą uaktualniać notatki.');
        }
        const note = await models.Note.findById(id);

        if (note && String(note.author) !== user.id) {
            throw new ForbiddenErorr("Nie masz uprawnień do uaktualnienia notatki.");
        }
        return await models.Note.findOneAndUpdate(
            {_id: id,
            },
            {
                $set: {
                    content
                }
            },
            {
                new: true
            }
        );
    },
    toggleFavorite: async(parent, {id}, {models, user}) => {
        if (!user){
            throw new AuthenticationError('Tylko zalogowani użytkownicy mogą polubić notatki.');
        }
        let noteCheck = await models.Note.findById(id);
        
        const hasUser = noteCheck.favoritedBy.indexOf(user.id);
        //console.log(noteCheck.favoritedBy);
        console.log(noteCheck);
        //noteCheck.favoritedBy[user.id] === undefined
        if (hasUser >= 0){
            return await models.Note.findByIdAndUpdate(
                id,
                {
                    $pull: {
                        favoritedBy: mongoose.Types.ObjectId(user.id)
                    },
                    $inc: {
                        favoriteCount: -1
                    }
                },
                {
                    new: true
                }
            );

        } else {
            return await models.Note.findByIdAndUpdate(
                id,
                {   
                    $push: {
                        favoritedBy: mongoose.Types.ObjectId(user.id)
                    },
                    $inc: {
                        favoriteCount: 1
                    }
                },
                {
                    new: true
                }
            );
        }
    }
}