// Создание, поиск, удаление Юзеров
const UserModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const {v4: uuidv4} = require('uuid')
const mailService = require('./mail-service')
const tokenService = require('./token-service')
const UserDTO = require('../DTOs/user-dto')
const ApiError = require('../exceptions/api-error')

class UserService {
    async registration(email,password){
        const candidate = await UserModel.findOne({email}) // проверяем есть ли такой пользователь в БД
        if(candidate) { // если есть - Бросаем ошибку
            throw ApiError.BadRequest(`Пользователь с таким эмейлом ${email} уже сущетвует`)
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
            throw ApiError.BadRequest('Некорректная ссылка активации')
        }
        user.isActivated = true;
        await user.save();
    }

    async login(email, password) {
        const user = await UserModel.findOne({email})
        if(!user) {
            throw ApiError.BadRequest('User not found')
        }
        const isPasswordEqual = await bcrypt.compare(password, user.password)
        if(!isPasswordEqual) {
            throw ApiError.BadRequest('Wrong Password')
        }
        const userDTO = new UserDTO(user);
        const tokens = await tokenService.generateTokens({...userDTO})

        await tokenService.saveToken(userDTO.id, tokens.refreshToken) // сохраняем рефреш токен в базу данных

        return {...tokens, user: userDTO} // возвращаем информацию о пользователе и токены
    }

    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken);
        return token;
    }

    async refresh(refreshToken) {
        if(!refreshToken) {
            throw ApiError.UnauthorizedError();
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDB = await tokenService.findToken(refreshToken);
        if(!userData || !tokenFromDB) {
            throw ApiError.UnauthorizedError();
        }
        const user = await UserModel.findById(userData.id);
        const userDTO = new UserDTO(user);
        const tokens = await tokenService.generateTokens({...userDTO})

        await tokenService.saveToken(userDTO.id, tokens.refreshToken)
        return {...tokens, user: userDTO}
    }

    async getAllUsers() {
        const users = await UserModel.find();
        return users;
    }
}

module.exports = new UserService();