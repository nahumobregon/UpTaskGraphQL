const mongoose = require('mongoose');
require('dotenv').config({ path: 'variables.env' });

const conectarDB = async () => {
	try {
		await mongoose.connect(process.env.DB_MONGO, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
			useCreateIndex: true,
		});
		console.log('conexion creada con exito a uptask');
	} catch (error) {
		console.log('hubo un error');
		console.log('error');
		process.exit(1); //en caso de error, se detiene la aplicacion
	}
};

module.exports = conectarDB;
