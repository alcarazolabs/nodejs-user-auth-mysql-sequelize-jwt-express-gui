import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import mysql2 from 'mysql2';

dotenv.config();

const sequelize = new Sequelize(
     process.env.DB_NAME,
     process.env.DB_USER,
     process.env.DB_PASSWORD, {

    host: process.env.DB_HOST,
    dialect: "mysql",
    dialectModule: mysql2,
    logging: false //Deshabilitar logs de consultas.

});

export default sequelize;
