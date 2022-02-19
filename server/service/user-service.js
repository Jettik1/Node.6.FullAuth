// Создание, поиск, удаление Юзеров
const UserModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const {v4: uuidv4} = require('uuid')
const mailService = require('./mail-service')
const tokenService = require('./token-service')
const UserDTO = require('../DTOs/user-dto')

class UserService {
    async registration(email,password){
        const candidate = await UserModel.findOne({email}) // проверяем есть ли такой пользователь в БД
        if(candidate) { // если есть - Бросаем ошибку
            throw new Error(`Пользователь с таким эмейлом ${email} уже сущетвует`)
        }
        // Если нет -
        const hashPassword = await bcrypt.hash(password, 3); // хешируем пароль
        const activationLink = uuidv4(); // либо uuid.v4() и const uuid = require('uuid') // делаем ссылку для активации
        const user = await UserModel.create({email,password: hashPassword, activationLink}) // в качестве password передаем hashPassword // сохраняем пользователя в базу данных
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`) // отправляем на почту ссылку для активации
        const userDTO = new UserDTO(user) // передаем в DTO созданную, заполненную модель // id, email, isActivated
        const tokens = tokenService.generateTokens({...userDTO}) // Используем DTO как payload, разварачиваем данный instance в новый объект с помощью оператора spread // генерируем токены
        await tokenService.saveToken(userDTO.id, tokens.refreshToken) // сохраняем рефреш токен в базу данных

        return {...tokens, user: userDTO} // возвращаем информацию о пользователе и токены
    }

    async activate(activationLink) {
        const user = await UserModel.findOne({activationLink})
        if(!user) {
            throw new Error('Некорректная ссылка активации')
        }
        user.isActivated = true;
        await user.save();
    }
}

module.exports = new UserService();