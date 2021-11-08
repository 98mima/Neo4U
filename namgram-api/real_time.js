module.exports = function(server){
    var io = require("socket.io")(server)
    var redis = require("redis")
    var client = redis.createClient()

    client.subscribe("likes")
    // console.log(io)

    client.on("message", function (channel, message) {
        console.log(message)
    })

    io.sockets.on("message", function(channel, message){
        console.log(message)
    })
    io.on('connection', (socket) => {
        console.log("gggggggg")
        socket.on('message', function(data) {
            io.emit('send', data)
        });
        // socket.on('update_active_users', function(data) {
        //     console.log("welcome")
        //     io.emit('active_users', data)
        // })
    })
}