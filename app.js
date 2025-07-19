import express from 'express';
import sequelize from './db.js';
import createUserModel from './models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

import { ValidationError } from 'sequelize'; // validator de sequelize

dotenv.config(); // Cargar variables del .env

// Instanciar modelo User
const User = createUserModel(sequelize);

// Obtener valor JWT_SECRET desde el .env
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();

// Obtener __dirname (no disponible directamente en ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



(async () => {

    try {
        await sequelize.authenticate();
        console.log("Conexion a la BD establecida!")
    
        await sequelize.sync({ alter: true }); // Sincronizar modelos con la BD.
        console.log("Modelos sincronizados con la BD.");
    
    } catch (error){
        console.log("No se pudo conectar a la BD: ", error);
    }


})();

app.use(express.json());


// Registro de usuarios
/*
app.post("/register", async (req, res) => {

    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        res.status(201).json({ 
            message: "Usuario registrado correctamente!",
            success: true,
            user
        });

    } catch (error) {
        console.log("Ocurrio un error en el registro del usuario: ", error);
        res.status(500).json({
            message: "Error en el servidor.",
            success: false
        });
    }

});
*/

app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validar contraseña antes de que sea hasheada por bcrypt. (Se hace esto por bcrypt puede hashear campos vacios y por ello se saltara la validación)
        if (!password || password.length < 6) {
            return res.status(400).json({
                message: "Error de validación",
                success: false,
                errors: ["La contraseña es requerida y debe tener al menos 6 caracteres."]
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        res.status(201).json({ 
            message: "Usuario registrado correctamente!",
            success: true,
            user
        });

    } catch (error) {
        // Primero, verificamos si el error es una instancia de ValidationError de Sequelize
        if (error instanceof ValidationError) {
            console.log("Error de validación:", error.errors);
            
            // Extraemos los mensajes de error personalizados que definimos en el modelo
            const errorMessages = error.errors.map(err => err.message);

            return res.status(400).json({ // 400 Bad Request es el código ideal para errores de validación
                message: "Error de validación",
                success: false,
                errors: errorMessages // Enviamos un array con todos los mensajes de error
            });
        }

        // Si es otro tipo de error (ej. error de conexión a la BD), lo manejamos como un error del servidor
        console.log("Ocurrió un error en el registro del usuario: ", error);
        res.status(500).json({
            message: "Error en el servidor.",
            success: false
        });
    }
});

// Login
app.post("/login", async (req, res) => {

    try {

       // console.log(req.body)

        const {email, password} = req.body;
        const user = await User.unscoped().findOne({ where: { email } }); // Usar unscoped() para poder hacer login ya que se ha excluido en el modelo la propiedad password.

        if (!user){
            return res.status(400).json({
                success: false,
                message: "Correo invalido"
            })
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch){
             return res.status(400).json({
                success: false,
                message: "Contraseña invalida"
            })
        }
        // Firmar token
        const token = jwt.sign({ userId: user.id },  JWT_SECRET, {
              expiresIn: "1h"
        });
        // Enviar token
        res.json({ success:true, token });

    } catch (error){

        console.log("Error al iniciar sesión en: ", error);
        res.status(500).json({
            message: "Error de servidor!"
        })
    }

});

// Middleware para verificar el JWToken.
function verifyToken(req, res, next){
    const token = req.header("Authorization");

    if (!token){
        return res.status(401).json({
            message: "Acceso denegado!"
        })
    }

    try {

        const decoded = jwt.verify(
            token.split(" ")[1],
             JWT_SECRET
        );
        req.user = decoded;
        next();

    } catch (error) {
        console.log("Error al verificar el token: ", error);
        res.status(401).json({
            message: "Token invalido!"
        })
    }
}

// Ruta protegida - Obtener información del usuario.
app.get("/userinfo", verifyToken, async (req, res) => {

    try {
        const user = await User.findByPk(req.user.userId);

        // const user = await User.unscoped().findByPk(req.user.userId); // Aqui se usa unscoped() para obligar al modelo retornar la password. Esto no se debe de hacer solo queda de ejemplo.

        if (!user){
            return res.status(404).json({
                message: "Usuario no encontrado!",
                success: false,
            })
        }
        // Enviar datos del usuario
        res.json( { user })
   
    } catch (error) {

        console.log("Error al obtener datos del usuario: ", error);

        res.status(500).json({
            message: "Error del Servidor",
            success: false,
        })
    }

});

// Mostrar vista principal
app.get("/", (req, res) => {
    
    res.sendFile(path.join(__dirname, 'public', 'user/index.html'));

});


// Mostrar vista Login
app.get("/guest/login", (req, res) => {
    
    res.sendFile(path.join(__dirname, 'public', 'login.html'));


});

// Mostrar vista registro
app.get("/guest/register", (req, res) => {
    
    res.sendFile(path.join(__dirname, 'public', 'register.html'));

});

// Iniciar Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("Servidor corriendo en el puerto: "+PORT);
})



