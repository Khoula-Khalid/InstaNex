require('dotenv').config();

var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/InstaNex-chat-app');

const app = require('express')();

const http = require('http').Server(app);

const userRoute = require('./routes/userRoute');

const User = require('./models/userModel');

const Chat = require('./models/chatModel');

app.use('/',userRoute);

const io = require('socket.io')(http);

var usp = io.of('/user-space');

usp.on('connection', async function(socket) {
        console.log('User Connected');
        
        var userId = socket.handshake.auth.token;

        if (!userId) {
            console.error('User ID is missing from socket authentication');
            return;
        }

        await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: '1' } });

        // user broadcast online
        socket.broadcast.emit('getOnlineUser', { user_id: userId });
        
        socket.on('disconnect', async function() {
            console.log('User Disconnected');

            if (!userId) {
                console.error('User ID is missing from socket authentication');
                return;
            }

            await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: '0' } });

            // user broadcast offline
            socket.broadcast.emit('getOfflineUser', { user_id: userId });
        });

        //Chatting
        socket.on('newChat', function(data){
            socket.broadcast.emit('loadNewChat', data);
        })

        //load old chats
        socket.on('existsChat',async function(data){
            var chats = await Chat.find({ $or:[

                { sender_id: data.sender_id, receiver_id: data.receiver_id },
                { sender_id: data.receiver_id, receiver_id: data.sender_id },
            ]});

            socket.emit('loadChats', { chats: chats });

        });

        //Delete chats
        socket.on('chatDeleted', function(id){
            socket.broadcast.emit('ChatMessageDeleted', id);
        });

    });

http.listen(3000, function(){
    console.log('Server is running');
});