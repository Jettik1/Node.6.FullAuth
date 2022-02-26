// 1) Задаем бзавую структуру(каркас) приложения
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
// чтобы прочитать .env нужен пакет dotenv
require('dotenv').config()
const PORT = process.env.PORT || 5000
const errorMiddleware = require('./middlewares/error-middleware')

const router = require('./router/index')

const app = express()

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL // Поле фронт-енда
}));
app.use('/api', router);
app.use(errorMiddleware); // обработчик ошибок должен идти в самом конце


const start = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
       app.listen(PORT, () => console.log(`Server work on PORT ${PORT}`))
    } catch (e) {
        console.log(e);
    }
}
start()

