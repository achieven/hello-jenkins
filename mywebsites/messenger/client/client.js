import React from 'react'
import io from '../../../node_modules/socket.io-client/socket.io.js'
var socket = io('/messengerReact')
const $ = require('../../.././node_modules/jquery/dist/jquery.min.js')
var clientComponent, loginComponent, chatComponent

function escapeUnescapeHtml(text) {
    text = text.split('<').join('&lt')
    text = text.split('>').join('&gt')
    return text
}

var LoginPage = React.createClass({
    render: function () {
        return (
            <div>
                <div className="col-xs-3">
                    <form className="loginForm">
                        <div className="row">
                            <label className="col-xs-6">Username</label>
                            <input type="text" className="col-xs-6 form-control usernameLogin"/>
                        </div>
                        <div className="row">
                            <label className="col-xs-6">Password</label>
                            <input type="text" className="col-xs-6 form-control passwordLogin"/>
                        </div>
                        <h4 className="row col-xs-12"></h4>
                        <h5 className="loginError hide row col-xs-12">No such username and password</h5>
                        <button className="btn btn-success row col-xs-12" type='submit'>Login</button>
                    </form>
                </div>
                <div className="col-xs-3"></div>
                <div className="col-xs-3">
                    <form className="signupForm">
                        <div className="row">
                            <label className="col-xs-3">Username</label>
                            <input type="text" className="col-xs-9 form-control usernameSignup"/>
                        </div>
                        <div className="row">
                            <label className="col-xs-3">Password</label>
                            <input type="text" className="col-xs-9 form-control passwordSignup"/>
                        </div>
                        <h4 className="row col-xs-12"></h4>
                        <button className="btn btn-success row col-xs-12" type='submit'>Sign Up</button>
                    </form>
                </div>
            </div>
        )
    },
    componentDidMount: function () {
        loginComponent = this
    },
    finishPage: function () {
        $('.loginForm').addClass('hide')
        $('.signupForm').addClass('hide')
    }
})

var MessageLine = React.createClass({
    getInitialState: function () {
        return {
            color: this.props.color || '',
            sender: this.props.sender || '',
            message: this.props.message || ''
        }
    },

    render: function () {
        var classname = "form-control alert " + this.props.color
        return (
            <div>
                <span className={classname} style={{display:'inline',  left:0}}>
                    {this.props.sender}: {this.props.message}
                </span>
                <p style={{paddingBottom: '15px'}}></p>
            </div>
        )
    }
})

var ChatPage = React.createClass({
    colors: {
        me: 'alert-info',
        others: [
            'alert-danger',
            'alert-success',
            'alert-warning'
        ]
    },
    getInitialState: function () {
        return {
            username: this.props.username || '',
            messages: this.props.messages || []
        }
    },
    startChat: function (username) {
        $('.helloUserName').removeClass('hide')
        $('.messageForm').removeClass('hide')
        this.listenToUserMessages()
        $('.messageForm').on('submit', function (e) {
            e.preventDefault()
            socket.emit('clientMessage', {message: $('.messageForm :input').val(), sender: username})
        })
        this.setState({
            username: username
        })
    },
    listenToUserMessages: function () {
        var thisComponent = this
        socket.on('serverMessageToOther', function (data) {
            thisComponent.handleIncomingMessage(data.message, data.sender, data.socketId)
        })
        socket.on('serverMessageToMe', function (data) {
            thisComponent.handleIncomingMessage(data.message, data.sender)
        })
    },
    handleIncomingMessage: function (message, sender, socketId) {
        var messages = this.updateStateWithoutRendering(message, sender, socketId)
        this.setState({
            messages: messages
        })
    },
    updateStateWithoutRendering: function (message, sender, socketId) {
        var messages = this.state.messages
        messages.push({message: message, sender: sender, socketId: socketId})
        return messages
    },
    buildMessagesToRender: function () {
        var messagesDomElements = []
        this.state.messages.forEach(function (data) {
            var color = data.sender === window.sessionStorage.getItem('chatUserName') ? chatComponent.colors.me : chatComponent.colors.others[(data.socketId) % (chatComponent.colors.others.length)]
            var sender = data.sender === window.sessionStorage.getItem('chatUserName') ? 'You' : data.sender
            messagesDomElements.push(
                <MessageLine message={data.message} sender={sender} color={color}></MessageLine>
            )
        })
        return messagesDomElements
    },
    render: function () {
        var messages = this.buildMessagesToRender()
        return (
            <div className="container">
                <h4 className="helloUserName row col-xs-12 hide">Hello {this.state.username}!</h4>
                <h4 className="row col-xs-12"></h4>
                <table className="table">
                    <tbody>
                    {messages || []}
                    </tbody>
                </table>
                <form className="messageForm hide">
                    <div className="form-group">
                        <div className="row">
                            <div className="col-xs-10">
                                <input className="form-control" type='text' placeholder='message'/>
                            </div>
                            <div className="col-xs-2">
                                <button className="btn btn-default" type='submit'>Submit</button>
                            </div>
                        </div>
                    </div>
                    <div className="row col-xs-12 serverMessage"></div>
                </form >
            </div>
        )
    },
    componentDidMount: function () {
        chatComponent = this
    }
})

var Client = React.createClass({
    render: function () {
        return (
            <div className="container">
                <script src="../../.././node_modules/bootstrap/dist/js/bootstrap.min.js"></script>
                <link rel="stylesheet" href="../../.././node_modules/bootstrap/dist/css/bootstrap.min.css"/>
                <LoginPage></LoginPage>
                <ChatPage></ChatPage>
            </div>

        )
    },
    navigateToChatPage: function (username) {
        window.sessionStorage.setItem('chatUserName', username)
        chatComponent.startChat(username)
        loginComponent.finishPage()
    },
    componentDidMount: function () {
        clientComponent = this
        // if(window.sessionStorage.getItem('chatUserName'){
        //     clientComponent.navigateToChatPage(window.sessionStorage.getItem('chatUserName'))
        // }
        $('.loadingMessage').addClass('hide')
        $.get("http://ipinfo.io", function (response) {
            var data = {
                ipAddress: response.ip,
                hostname: response.hostname,
                country: response.country,
                city: response.city,
                loc: response.loc,
                org: response.org,
                region: response.region
            }
            $.ajax({
                type: 'post',
                url: '/userDetails/userdata',
                data: JSON.stringify(data),
                contentType: 'application/json'
            })
        }, "jsonp")

        $('.loginForm').on('submit', function (e) {
            var data = {
                username: $('.usernameLogin').val(),
                password: $('.passwordLogin').val()
            }
            e.preventDefault()
            socket.emit('login', data)
            socket.on('loginSuccess', function (username) {
                clientComponent.navigateToChatPage(username);
            })
            socket.on('loginFail', function () {
                $('.loginError').removeClass('hide')
            })
        })
        $('.signupForm').on('submit', function (e) {
            e.preventDefault()
            var data = {
                username: $('.usernameSignup').val(),
                password: $('.passwordSignup').val()
            }
            socket.emit('signup', data)
            socket.on('signupSuccess', function (username) {
                clientComponent.navigateToChatPage(username);
            })
        })

    }
})

module.exports = Client