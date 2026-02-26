const mongoose = require('mongoose')


function connectToDB(){
mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log('server connected to db')
}).catch(err=>{
    console.log(err)
    process.exit(1)
})
}

module.exports = connectToDB
