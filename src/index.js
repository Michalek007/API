const {ApolloServer} = require('apollo-server-express');
const typeDefs = require('./schema');
const helmet = require('helmet');
const cors = require('cors');

const express = require('express');
const app = express();
app.use(helmet());
app.use(cors());


require('dotenv').config();
const db = require('./db');
const DB_HOST = process.env.DB_HOST;
db.connect(DB_HOST);
const port = process.env.PORT || 4000;

const jwt = require('jsonwebtoken');
const {models} = require('./models');
const resolvers = require('./resolvers');

const getUser = token => {
    if (token) {
        try{
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            throw new Error('Nieprawidłowa sesja');
        }
    }
};
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ( {req} ) => {
        const token = req.headers.authorization;
        const user = getUser(token);
        console.log(user);
        return {models, user};
    }
});
server.applyMiddleware({app, path: '/api'});
app.get('/',(req,res) => res.send('piwo!'));
app.listen({port}, () => console.log('piwo na porcie 4000!'));