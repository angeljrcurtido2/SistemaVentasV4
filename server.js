const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

//Habilitar CORS para todas las rutas
app.use(cors());

app.use(express.json()); // Añade esta línea

mongoose.connect('mongodb+srv://angeljrcurtido:curtidobenitez082@cluster0.j3h8cfj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Conexión a MongoDB Atlas exitosa'))
  .catch(err => console.error('Error de conexión a MongoDB Atlas', err));

//Modelos
const cajaSchema = new mongoose.Schema({
  estado: { type: String, default: 'cerrado' },
  situacionCaja: { type: String, default: 'Activo' }, // Nuevo campo
  fechaApertura: { type: Date },
  fechaCierre: { type: Date },
  montoInicial: { type: Number, required: true },
  montoFinal: { type: Number },
  moneda: { type: Number }, // Monto en moneda
  billete: { type: Number }, // Monto en billetes
  cheque: { type: Number }, // Monto en cheques
  tarjeta: { type: Number }, // Monto en tarjetas
  gastos: { type: Number }, // Monto en gastos
  ingresos: { type: Number } // Monto en ingresos
});

const Caja = module.exports = mongoose.model('Caja', cajaSchema);

// Datos de Cliente
const DatosClienteSchema = new mongoose.Schema({
  nombreCliente: String,
  rucCliente: String,
  direccionCliente: String,
});
const DatosCliente = mongoose.model('DatosCliente', DatosClienteSchema);
//Datos de Empresa
const DatosEmpresaSchema = new mongoose.Schema({
  Comercial: String,
  Ruc: String,
  Telefono: String,
  Direccion: String,
  Timbrado: String,
});

const DatosEmpresa = mongoose.model('DatosEmpresa', DatosEmpresaSchema);
//Categoria
const CategoriaSchema = new mongoose.Schema({
  nombre: String,
});
const Categoria = mongoose.model('Categoria', CategoriaSchema);
//Proveedor 
const ProveedorSchema = new mongoose.Schema({
  nombreEmpresa: String,
  ruc: String,
  direccion: String,
  telefono: String,

})
const Proveedor = mongoose.model('Proveedor', ProveedorSchema);

//Producto
const ProductoSchema = new mongoose.Schema({
  nombreProducto: String,
  categoria: String, // Nuevo campo
  precioCompra: Number,
  precioVenta: Number,
  fechaVencimiento: Date,
  stockMinimo: Number,
  Iva: String,
  stockActual: Number,
  ubicacion: String,
  proveedor: String,
  unidadMedida: String,
  codigoBarra: String, // Nuevo campo
});


const Producto = mongoose.model('Producto', ProductoSchema);

//Contador Numero Interno
const ContadorSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Contador = mongoose.model('Contador', ContadorSchema);

//Ventas  
const VentaSchema = new mongoose.Schema({
  numeroInterno: Number,
  numeroFactura: String,
  numeroTimbrado: String,
  cliente: String,
  comercial: String,
  telefono: String,
  rucempresa: String,
  ruccliente: String,
  direccion: String,
  productos: [
    {
      producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
      nombreProducto: {  // Nuevo campo
        type: String
      },
      precioVenta: {  // Nuevo campo
        type: String
      },
      cantidad: Number
    }
  ],
  PrecioVentaTotal: Number,
  PrecioCostoTotal: Number,
  Ganancias: Number,
  Iva10: Number, // Nuevo campo para el IVA del 10%
  Iva5: Number, // Nuevo campo para el IVA del 5%
  estado: { type: String, default: 'activo' },
  fechaVenta: { type: Date, default: Date.now }
});

const Venta = mongoose.model('Venta', VentaSchema);
// ESQUEMA COMPRAS 
const compraSchema = new mongoose.Schema({
  proveedor: { type: String, required: true },
  producto: [
    {
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    nombreProducto: { type: String, required: true },
    cantidad: { type: Number, required: true },
    precioCompra: { type: Number, required: true },
  } 
],
  
  precioCompraTotal: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  facturaNumero: { type: String },
  Telefono: { type: String },
  Direccion: { type: String }
});
const Compra = module.exports = mongoose.model('Compra', compraSchema);
//FIN ESQUEMA COMPRAS

//CONTROLLERS PARA CAJA

// Crear apertura de caja
app.post('/caja/abrir', async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const existingCaja = await Caja.findOne({
    estado: 'abierto',
    situacionCaja: 'Activo',
    fechaApertura: { $gte: start, $lt: end }
  });

  if (existingCaja) {
    return res.status(400).send('Ya existe una caja abierta y activa para hoy.');
  }

  const caja = new Caja({
    estado: 'abierto',
    situacionCaja: 'Activo',
    fechaApertura: new Date(),
    montoInicial: req.body.montoInicial,
    moneda: req.body.moneda,
    billete: req.body.billete,
    cheque: req.body.cheque,
    tarjeta: req.body.tarjeta,
    gastos: req.body.gastos,
    ingresos: req.body.ingresos
  });

  await caja.save();
  res.send(caja);
});

// Cerrar caja
app.put('/caja/cerrar/:id', async (req, res) => {
  const caja = await Caja.findByIdAndUpdate(req.params.id, {
    estado: 'cerrado',
    fechaCierre: new Date(),
    montoFinal: req.body.montoFinal,
    moneda: req.body.moneda,
    billete: req.body.billete,
    cheque: req.body.cheque,
    tarjeta: req.body.tarjeta,
    gastos: req.body.gastos,
    ingresos: req.body.ingresos
  }, { new: true });
  res.send(caja);
});
// Obtener todas las cajas
app.get('/caja', async (req, res) => {
  const cajas = await Caja.find();
  res.send(cajas);
});
// Obtener todas las cajas ordenadas por fecha de apertura
app.get('/caja/fechaapertura', async (req, res) => {
  const cajas = await Caja.find().sort({ fechaApertura: -1 });
  res.send(cajas);
});
// Obtener todas las cajas abiertas y activas
app.get('/caja/abiertas', async (req, res) => {
  const cajas = await Caja.find({ estado: 'abierto', situacionCaja: 'Activo' });
  res.send(cajas);
});
// Obtener todas las cajas activas
app.get('/caja/activas', async (req, res) => {
  const cajas = await Caja.find({ situacionCaja: 'Activo' });
  res.send(cajas);
});
// Anular caja
app.put('/caja/anular/:id', async (req, res) => {
  const caja = await Caja.findByIdAndUpdate(req.params.id, {
    situacionCaja: 'Anulado' // Establecer a 'Anulado'
  }, { new: true });
  res.send(caja);
});
//CONTROLLERS PARA PROVEEDOR
//Crear proveedor
app.post('/proveedor', async (req, res) => {
  console.log(req.body);
  const proveedor = new Proveedor(req.body);
  await proveedor.save();
  res.send(proveedor);
});
//Editar un proveedor
app.put('/proveedor/:id', async (req, res) => {
  const proveedor = await Proveedor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.send(proveedor);
});
//Obtener todos los proveedores
app.get('/proveedor', async (req, res) => {
  const proveedores = await Proveedor.find();
  res.send(proveedores);
});
//Obtener un proveedor por id
app.get('/proveedor/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findById(req.params.id);
    if (!proveedor) {
      return res.status(404).send({ message: 'Proveedor no encontrado' });
    }
    res.send(proveedor);
  } catch (error) {
    res.status(500).send({ message: 'Error al obtener el proveedor' });
  }
});
//Eliminar un proveedor
app.delete('/proveedor/:id', async (req, res) => {
  await Proveedor.findByIdAndDelete(req.params.id);
  res.send({ message: 'Proveedor eliminado' });
});
//FIN CONTROLLER PARA PROVEEDOR
//CONTROLLERS PARA CATEGORIAS
app.post('/categorias', async (req, res) => {
  console.log(req.body);
  const categoria = new Categoria(req.body);
  await categoria.save();
  res.send(categoria);
});

app.put('/categorias/:id', async (req, res) => {
  const categoria = await Categoria.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.send(categoria);
});

app.get('/categorias', async (req, res) => {
  const categorias = await Categoria.find();
  res.send(categorias);
});
//Visualizar una categoria por id 
app.get('/categorias/:id', async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);
    if (!categoria) {
      return res.status(404).send({ message: 'Categoria no encontrada' });
    }
    res.send(categoria);
  } catch (error) {
    res.status(500).send({ message: 'Error al obtener la categoria' });
  }
});

app.delete('/categorias/:id', async (req, res) => {
  await Categoria.findByIdAndDelete(req.params.id);
  res.send({ message: 'Categoria eliminada' });
});
// CONTROLLER FIN CATEGORIAS
// CONTROLLLER INICIO PRODUCTOS
// Crear un nuevo producto
app.post('/productos', async (req, res) => {
  const producto = new Producto(req.body);
  await producto.save();
  res.send(producto);
});

// Obtener todos los productos
app.get('/productos', async (req, res) => {
  const productos = await Producto.find();
  res.send(productos);
});
// Obtener un producto específico por su id
app.get('/productos/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).send('Producto no encontrado');
    }
    res.send(producto);
  } catch (error) {
    res.status(500).send('Error del servidor');
  }
});
// Obtener el nombre de un producto específico por su id
app.get('/productos/:id/nombre', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).send('Producto no encontrado');
    }
    res.send(producto.nombreProducto);
  } catch (error) {
    res.status(500).send('Error del servidor');
  }
});

// Actualizar un producto
app.put('/productos/:id', async (req, res) => {
  const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.send(producto);
});

// Eliminar un producto
app.delete('/productos/:id', async (req, res) => {
  await Producto.findByIdAndDelete(req.params.id);
  res.send({ message: 'Producto eliminado' });
});

// Obtener un producto específico por su codigoBarra
app.get('/productos/codigo-barra/:codigoBarra', async (req, res) => {
  try {
    const producto = await Producto.findOne({ codigoBarra: req.params.codigoBarra });
    if (!producto) {
      return res.status(404).send('Producto no encontrado');
    }
    res.send(producto);
  } catch (error) {
    res.status(500).send('Error del servidor');
  }
});

// CONTROLLLER FIN PRODUCTOS
// CONTROLLER INICIO VENTAS 
// ======CREAR VENTAS==========
app.post('/ventas', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Crear una nueva venta
    const venta = new Venta(req.body);
 
    // Incrementar el contador y usar el valor actualizado como el número interno
    const contador = await Contador.findByIdAndUpdate({ _id: 'numeroFactura' }, { $inc: { seq: 1 } }, { new: true, upsert: true, session });
    venta.numeroInterno = contador.seq;

    // Generar el número de factura con el formato 001-001-0000001
    venta.numeroFactura = `001-001-${contador.seq.toString().padStart(7, '0')}`;

    // Inicializar los totales
    venta.PrecioVentaTotal = 0;
    venta.PrecioCostoTotal = 0;
    let iva10Total = 0;
    let iva5Total = 0;

    // Crear un nuevo array para los productos con los nombres y precios de venta incluidos
    let productosConNombresYPrecios = [];

    // Para cada producto vendido
    for (let item of req.body.productos) {
      // Buscar el producto
      const producto = await Producto.findById(item.producto);

      // Crear un nuevo objeto con el nombre del producto y el precio de venta incluidos
      let itemConNombreYPrecioVenta = { ...item, nombreProducto: producto.nombreProducto, precioVenta: producto.precioVenta };

      // Agregar el nuevo objeto al array
      productosConNombresYPrecios.push(itemConNombreYPrecioVenta);

      // Restar la cantidad vendida del stock actual
      producto.stockActual -= item.cantidad;

      // Actualizar los totales
      venta.PrecioVentaTotal += item.cantidad * producto.precioVenta;
      venta.PrecioCostoTotal += item.cantidad * producto.precioCompra;

      // Calcular el IVA
      if (producto.Iva === '10%') {
        iva10Total += item.cantidad * producto.precioVenta;
      } else if (producto.Iva === '5%') {
        iva5Total += item.cantidad * producto.precioVenta;
      }

      // Guardar el producto actualizado
      await producto.save({ session });
    }

    // Calcular las ganancias
    venta.Ganancias = venta.PrecioVentaTotal - venta.PrecioCostoTotal;

    // Calcular el IVA
    venta.Iva10 = iva10Total / 11;
    venta.Iva5 = iva5Total / 21;

    // Asignar el nuevo array a venta.productos
    venta.productos = productosConNombresYPrecios;
    // Guardar la venta
    await venta.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.send(venta);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});
// ======FIN CREAR VENTAS==========
//====OBTENER TOTAL DE VENTAS REALIZADAS===========
// Obtener el monto total de las ventas del día
app.get('/ventas/total-del-dia', async (req, res) => {
  // Obtener la fecha actual
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Obtener la fecha del día siguiente
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);

  // Buscar todas las ventas realizadas hoy
  const ventas = await Venta.find({
    fechaVenta: {
      $gte: hoy,
      $lt: manana
    }
  });

  // Sumar los totales de las ventas
  let total = 0;
  for (let venta of ventas) {
    total += venta.PrecioVentaTotal;
  }

  // Enviar el total
  res.send({ total });
});
//====ANULAR VENTAS===============
app.put('/ventas/anular/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Buscar la venta
    const venta = await Venta.findById(req.params.id);

    // Cambiar el estado de la venta a "anulado"
    venta.estado = 'anulado';

    // Para cada producto vendido
    for (let item of venta.productos) {
      // Buscar el producto
      const producto = await Producto.findById(item.producto);

      // Devolver la cantidad vendida al stock actual
      producto.stockActual += item.cantidad;

      // Guardar el producto actualizado
      await producto.save({ session });
    }

    // Guardar la venta actualizada
    await venta.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.send({ message: 'Venta anulada', venta });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

//====FIN ANULAR VENTAS===============

// Obtener todas las ventas
app.get('/ventas', async (req, res) => {
  try {
    const ventas = await Venta.find().populate('productos.producto');
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar una venta
app.delete('/ventas/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Venta.findByIdAndDelete(req.params.id, { session });

    await Contador.findByIdAndUpdate({ _id: 'numeroInterno' }, { $inc: { seq: -1 } }, { session });

    await session.commitTransaction();
    session.endSession();

    res.send({ message: 'Venta eliminada' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});
// CONTROLLER FIN VENTAS
app.post('/compras', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const productos = req.body.productos;
    const proveedor = req.body.proveedor;
    const productosCompra = [];

    let precioCompraTotal = 0;

    for (let i = 0; i < productos.length; i++) {
      let producto;
      if (productos[i].productoId) {
        producto = await Producto.findById(productos[i].productoId);
      } else {
        producto = new Producto({
          nombre: productos[i].nombreProducto,
          descripcion: productos[i].descripcionProducto,
          categoria: productos[i].categoriaProducto,
          proveedor: proveedor,
          precioCompra: productos[i].precioCompra,
          precioVenta: productos[i].precioVenta || producto.precioVenta,
        });
      }

      producto.stockActual += productos[i].cantidad;
      producto.precioVenta = productos[i].precioVentaActualizado || producto.precioVenta;
      producto.precioCompra = productos[i].precioCompra;

      productosCompra.push({
        producto: producto._id,
        nombreProducto: producto.nombreProducto,
        cantidad: productos[i].cantidad,
        precioCompra: productos[i].precioCompra,
      });

      precioCompraTotal += productos[i].precioCompra * productos[i].cantidad;

      await producto.save({ session });
    }

    const compra = new Compra({
      proveedor: proveedor,
      producto: productosCompra,
      precioCompraTotal: precioCompraTotal,
      facturaNumero: req.body.facturaNumero,
      Telefono: req.body.Telefono,
      Direccion: req.body.Direccion
    });

    await compra.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.send({ message: 'Compras realizadas', compra });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});
// Obtener el monto total de las compras del día
app.get('/compras/total-del-dia', async (req, res) => {
  // Obtener la fecha actual
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Obtener la fecha del día siguiente
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);

  // Buscar todas las compras realizadas hoy
  const compras = await Compra.find({
    fecha: {
      $gte: hoy,
      $lt: manana
    }
  });

  // Sumar los totales de las compras
  let total = 0;
  for (let compra of compras) {
    total += compra.precioCompraTotal;
  }

  // Enviar el total
  res.send({ total });
});
app.delete('/compras/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const compra = await Compra.findById(req.params.id);
    if (!compra) return res.status(404).send('La compra con el ID dado no fue encontrada.');

    // Iterar sobre todos los productos asociados a la compra
    for (let i = 0; i < compra.producto.length; i++) {
      // Buscar el producto
      const producto = await Producto.findById(compra.producto[i].producto);
      if (!producto) return res.status(404).send('El producto asociado a la compra no fue encontrado.');

      // Actualizar el stock del producto
      producto.stockActual -= compra.producto[i].cantidad;

      // Guardar el producto actualizado
      await producto.save({ session });
    }

    // Eliminar la compra
    await Compra.deleteOne({ _id: compra._id }, { session });

    await session.commitTransaction();
    session.endSession();

    res.send(compra);
  } catch (error) {
    console.error(error); // Imprime el error en la consola
    await session.abortTransaction();
    session.endSession();
    res.status(500).send('Algo salió mal.');
  }
});
// Controlador para obtener todas las compras
app.get('/compras', async (req, res) => {
  try {
    const compras = await Compra.find();
    res.send(compras);
  }
  catch (error) {
    res.status(500).send('Algo salió mal.');
  }
});

// Controlador para editar una compra
app.put('/compras/:id', async (req, res) => {
  try {
    const compra = await Compra.findByIdAndUpdate(
      req.params.id,
      {
        proveedor: req.body.proveedor,
        producto: req.body.producto,
        cantidad: req.body.cantidad,
        precioCompra: req.body.precioCompra,
        precioCompraTotal: req.body.precioCompra * req.body.cantidad,
        facturaNumero: req.body.facturaNumero,
        Telefono: req.body.Telefono,
        Direccion: req.body.Direccion
      },
      { new: true }
    );

    if (!compra) return res.status(404).send('La compra con el ID dado no fue encontrada.');
    res.send(compra);
  } catch (error) {
    res.status(500).send('Algo salió mal.');
  }
});

//==== Controladores para el cliente =====
// Crear datos de cliente
app.post('/datos-cliente', async (req, res) => {
  const datosCliente = new DatosCliente(req.body);
  await datosCliente.save();
  res.status(201).send(datosCliente);
});

// Editar datos de cliente por ID
app.put('/datos-cliente/:id', async (req, res) => {
  const datosCliente = await DatosCliente.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.send(datosCliente);
});

// Eliminar datos de cliente
app.delete('/datos-cliente/:id', async (req, res) => {
  const datosCliente = await DatosCliente.findByIdAndDelete(req.params.id);
  res.send(datosCliente);
});

// Obtener todos los datos de cliente
app.get('/datos-cliente', async (req, res) => {
  const datosCliente = await DatosCliente.find();
  res.send(datosCliente);
});

// Obtener el último dato de cliente cargado
app.get('/datos-cliente/ultimo', async (req, res) => {
  const datosCliente = await DatosCliente.findOne().sort({ _id: -1 });
  res.send(datosCliente);
});
//====== Controladores para datos de Empresas ========
// Crear datos de empresa
app.post('/datos-empresa', async (req, res) => {
  const datosEmpresa = new DatosEmpresa(req.body);
  await datosEmpresa.save();
  res.status(201).send(datosEmpresa);
});

// Editar datos de empresa por ID
app.put('/datos-empresa/:id', async (req, res) => {
  const datosEmpresa = await DatosEmpresa.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.send(datosEmpresa);
});

// Eliminar datos de empresa
app.delete('/datos-empresa/:id', async (req, res) => {
  const datosEmpresa = await DatosEmpresa.findByIdAndDelete(req.params.id);
  res.send(datosEmpresa);
});

// Obtener todos los datos de empresa
app.get('/datos-empresa', async (req, res) => {
  const datosEmpresa = await DatosEmpresa.find();
  res.send(datosEmpresa);
});

// Obtener el último dato de empresa cargado
app.get('/datos-empresa/ultimo', async (req, res) => {
  const datosEmpresa = await DatosEmpresa.findOne().sort({ _id: -1 });
  res.send(datosEmpresa);
});

app.listen(3001, () => {
  console.log('Servidor corriendo en el puerto 3001');
});