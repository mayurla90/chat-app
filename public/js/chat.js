const socket = io()

const chatForm = document.querySelector('#msgForm');
const chatMsgInput = document.querySelector('input');
const msgSendButton  = document.querySelector('button')
const $messages = document.querySelector('#messages')
const sendLocationBtn = document.querySelector('#send-location')

const messageTemplate = document.querySelector('#msg-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix: true})


const autoScroll = () => {
// new message  element
const $newMessage = $messages.lastElementChild

//height of the new message
const newMessageStyles = getComputedStyle($newMessage)
const newMessageMargin = parseInt(newMessageStyles.marginBottom)
const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

console.log($messages.scrollTop)

//visible height
const visibleHeight =  $messages.offsetHeight

// height of message container
const containerHeight = $messages.scrollHeight

//how far I have scrolled?
const scrollOffset = $messages.scrollTop + visibleHeight

if(containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
}

}



chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    msgSendButton.setAttribute('disabled','disabled')
    const msg = e.target.elements.message.value;
    socket.emit('sendMessage',msg, (error) => {
       msgSendButton.removeAttribute('disabled')
       chatMsgInput.value=''
       chatMsgInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('the message was delivered ')
    })
})

socket.on('message', (msg) => {
    const html = Mustache.render(messageTemplate,{
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML("beforeend",html)  
    autoScroll()
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate,{
      username: message.username,  
      url : message.url,
      createdAt :  moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML("beforeend",html)  
    autoScroll()
})

socket.on('roomData', ({room,users}) => {
  const html = Mustache.render(sidebarTemplate,{
      room,
      users
  })  
  document.querySelector('#sidebar').innerHTML = html  
})

sendLocationBtn.addEventListener('click', () => {
  if(!navigator.geolocation){
      return alert("Geolocation is not supported on your browser")
  }
  sendLocationBtn.setAttribute('disabled','disabled')
  navigator.geolocation.getCurrentPosition((position) => {

    const objLocation = {
        Location: {
            lat : position.coords.latitude,
            long: position.coords.longitude
        }
    }
    socket.emit('sendLocation',objLocation,() => {
        sendLocationBtn.removeAttribute('disabled')
        console.log('location was shared')
    })
  })
})

socket.emit('join',{username,room},(error) => {
    if(error) {
        alert(error)
        location.href='/'
    }
})