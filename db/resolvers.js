const Usuario = require('../models/Usuario');
const Proyecto = require('../models/Proyecto');
const Tarea = require('../models/Tarea');

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { isRequiredArgument } = require('graphql');

require('dotenv').config({ path: 'variables.env' });

//Crea y firma un JWT
const crearToken = (usuario, secreta, expiresIn) => {
	const { id, email, nombre } = usuario;

	//se crea el payload
	return jwt.sign({ id, email, nombre }, secreta, { expiresIn });
};

const resolvers = {
	Query: {
		obtenerProyectos: async (_, {}, ctx) => {
			const proyectos = await Proyecto.find({ creador: ctx.usuario.id });
			return proyectos;
		},
		obtenerTareas: async (_, { input }, ctx) => {
			const tareas = await Tarea.find({ creador: ctx.usuario.id })
				.where('proyecto')
				.equals(input.proyecto);
			return tareas;
		},
	},
	Mutation: {
		crearUsuario: async (_, { input }, ctx) => {
			const { email, password } = input;

			const existeUsuario = await Usuario.findOne({ email });
			//console.log(existeUsuario);

			//si el usuario existe
			if (existeUsuario) {
				throw new Error('El usuario ya está registrado');
			}

			try {
				//Hashear password
				const salt = await bcryptjs.genSalt(10); //genera una cadena dificil de hackear
				input.password = await bcryptjs.hash(password, salt);

				//console.log(input);
				//Registrar nuevo usuario

				const nuevoUsuario = new Usuario(input);
				//console.log(nuevoUsuario);

				//guardar usuario en la base de datos
				nuevoUsuario.save();
				return 'Resolvers.js Usuario creado correctamente';
			} catch (error) {
				console.log(error);
			}
		},
		autenticarUsuario: async (_, { input }) => {
			const { email, password } = input;

			//si el usuario existe
			const existeUsuario = await Usuario.findOne({ email });
			//console.log(existeUsuario);

			//si el usuario existe
			if (!existeUsuario) {
				throw new Error('El usuario no existe');
			}

			//si el password es correcto
			const passwordCorrecto = await bcryptjs.compare(
				password,
				existeUsuario.password
			);

			if (!passwordCorrecto) {
				throw new Error('Password Incorrecto');
			}

			//dar acceso a la app
			//return 'resolvers.js Has iniciado sesion';

			return {
				token: crearToken(existeUsuario, process.env.SECRETA, '2hr'),
			};
		},
		nuevoProyecto: async (_, { input }, ctx) => {
			// el context ctx , a mi entender, viene desde index.js
			// y es el usuario que en este momento esta logeado
			//
			/* 
                console.log('resolver.js ctx ', ctx);
            */
			//console.log('resolver.js ctx ', ctx);
			// ctx , nos esta retornando el usuario

			//Ejemplo de lo que se imprime en consola
			//resolver.js ctx  {
			// usuario: {
			//   id: '5f1df6ebc8ffec28909170ba',

			//   email: 'naomi@gmail.com',
			//   iat: 1595831544,
			//   exp: 1595838744
			// },
			// _extensionStack: GraphQLExtensionStack { extensions: [] }
			//}

			try {
				const proyecto = new Proyecto(input);

				// Asociar el creador del proyecto
				proyecto.creador = ctx.usuario.id;

				//almacenar el resultado en la bd
				const resultado = await proyecto.save();

				return resultado;
			} catch (error) {
				console.log(error);
			}
		},
		actualizarProyecto: async (_, { id, input }, ctx) => {
			//revisar si el proyecto existe
			let proyecto = await Proyecto.findById(id);
			// el id , proviene del Schema -> actualizarProyecto(id: ID!, input: ProyectoInput): Proyecto

			if (!proyecto) {
				throw new Error('Proyecto no encontrado');
			}

			//revisar si la persona que trata de editarlo es el creador
			//console.log(proyecto);
			//nos regresa lo siguiente
			/*{
				creado: 2020-07-27T23:32:57.075Z,
				_id: 5f1f64bb5192913280a69ef0,
				nombre: 'Aplicacion en GraphQL 2',
				creador: 5f1df6ebc8ffec28909170ba,
				__v: 0
			  }
			  // console.log(typeof proyecto.creador)
			  // si observamos , creador , es un objeto , no viene entre comilla simple
			  //por lo tanto hay que hacer lo siguiente
			*/

			if (proyecto.creador.toString() !== ctx.usuario.id) {
				throw new Error('No tienes las credenciales para editar');
			}

			//guardar el proyecto actualizado
			proyecto = await Proyecto.findOneAndUpdate({ _id: id }, input, {
				new: true,
			});
			return proyecto;
		},
		eliminarProyecto: async (_, { id }, ctx) => {
			//revisar si el proyecto existe
			let proyecto = await Proyecto.findById(id);
			// el id , proviene del Schema -> actualizarProyecto(id: ID!, input: ProyectoInput): Proyecto

			if (!proyecto) {
				throw new Error('Proyecto no encontrado');
			}

			//revisar si la persona que trata de editarlo es el creador
			//console.log(proyecto);
			//nos regresa lo siguiente
			/*{
							creado: 2020-07-27T23:32:57.075Z,
							_id: 5f1f64bb5192913280a69ef0,
							nombre: 'Aplicacion en GraphQL 2',
							creador: 5f1df6ebc8ffec28909170ba,
							__v: 0
						  }
						  // console.log(typeof proyecto.creador)
						  // si observamos , creador , es un objeto , no viene entre comilla simple
						  //por lo tanto hay que hacer lo siguiente
						*/

			if (proyecto.creador.toString() !== ctx.usuario.id) {
				throw new Error('No tienes las credenciales para editar');
			}

			//Eliminar Proyecto
			await Proyecto.findOneAndDelete({ _id: id });
			return 'Proyecto Eliminado';
		},
		nuevaTarea: async (_, { input }, ctx) => {
			try {
				const tarea = new Tarea(input);
				tarea.creador = ctx.usuario.id;
				const resultado = await tarea.save();
				return resultado;
			} catch (error) {
				console.log(error);
			}
		},
		actualizarTarea: async (_, { id, input, estado }, ctx) => {
			//si la tarea existe o no
			let tarea = await Tarea.findById(id);

			if (!tarea) {
				throw new Error('Error, tarea no encontrada');
			}

			//si la persona que lo edita es el creador del proyecto
			if (tarea.creador.toString() !== ctx.usuario.id) {
				throw new Error('No tienes las credenciales para editar');
			}
			//asignar el estado de la tarea
			input.estado = estado;

			//guardar y retornar la tarea
			tarea = await Tarea.findOneAndUpdate({ _id: id }, input, { new: true });

			return tarea;
		},
		eliminarTarea: async (_, { id }, ctx) => {
			//si la tarea existe o no
			let tarea = await Tarea.findById(id);

			if (!tarea) {
				throw new Error('Error, tarea no encontrada');
			}

			//si la persona que lo edita es el creador del proyecto
			if (tarea.creador.toString() !== ctx.usuario.id) {
				throw new Error('No tienes las credenciales para eliminar');
			}

			//Eliminar tarea
			await Tarea.findOneAndDelete({ _id: id });
			return 'Tarea Eliminada';
		},
	},
};

module.exports = resolvers;
