const mongoose = require('mongoose');

const TareaSchema = mongoose.Schema({
	nombre: {
		type: String,
		required: true,
		trim: true,
	},
	creador: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Usuario',
	},
	creado: {
		type: Date,
		default: Date.now(),
	},
	proyecto: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Proyecto',
	},
	estado: {
		type: Boolean,
		default: false,
	},
});

//  type: mongoose.Schema.Types.ObjectId,   -> en esta linea obtiene el id de mongo
//  ref: 'Usuario' -> sirve para saber de donde va a obtener el id - el id del usuario en este caso
// la referencia se obtiene del modelo que se llama 'Usuario'

module.exports = mongoose.model('Tarea', TareaSchema);
