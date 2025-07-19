import { DataTypes } from 'sequelize';

export default function (sequelize) {
    
    const User = sequelize.define(
        "user",
        {
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                  validate: {
                    notEmpty: {
                        msg: "El username de usuario no puede estar vacío." // Mensaje de error personalizado
                    },
                    len: {
                        args: [5, 255], // Mínimo 3 caracteres, máximo 255
                        msg: "El username debe tener al menos 5 caracteres."
                    },
                }
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: {
                        msg: "El email no puede estar vacío." // Mensaje de error personalizado
                    },
                    isEmail: {
                        msg: "Debe proporcionar una dirección de correo válida." // Mensaje de error para formato
                    },
                }
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: "La contraseña no puede estar vacía."
                    },
                    len: {
                        args: [6, 255], // Mínimo 6 caracteres, máximo 255
                        msg: "La contraseña debe tener al menos 6 caracteres."
                    },
                }
            }
        },
            {
                timestamps: false,
                defaultScope: {
                    attributes: { exclude: ['password'] } // Excluir que se retorne la propiedad password en las consultas. https://youtu.be/ZIEo64PPrvU
                 },
                
            },
            
    );

    return User
};