const app = require('./src/app')
require("dotenv").config();
const connectDb=require('./src/config/db')

connectDb();

app.listen(3000,()=>{
    console.log(`server runnig on port 3000`)
})
