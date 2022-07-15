const mongoose = require('mongoose');

module.exports = {
    connect: DB_HOST => {
        mongoose.set('useNewUrlParser',true);
        mongoose.set('useFindAndModify', false);
        mongoose.set('useCreateIndex',true);
        mongoose.set('useUnifiedTopology',true);
        mongoose.connect(DB_HOST);

        mongoose.connection.on('error',err => {
            console.error(err);
            console.log('Brak piwa. Upewnij się że browar został zakupiony');
            process.exit();
        });
    },
    close: () => {
        mongoose.connection.close();
    }
};