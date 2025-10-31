import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useParams, Link } from 'react-router-dom';
import { Heart, Clock, Users, ChefHat, Star, ArrowLeft } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const ProductDetails = () => {
  const {
    products,
    navigate,
    fetchProductById,
    addToCart,
  } = useAppContext();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('ingredients');
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);

      // Primero buscar en los productos ya cargados
      const existingProduct = products.find((item) => item.ID_PRODUCTO == id);

      if (existingProduct) {
        console.log('Product found in existing products:', existingProduct);
        setProduct(existingProduct);
      } else {
        // Si no está en los productos cargados, obtener desde API
        console.log('Fetching product from API...');
        const fetchedProduct = await fetchProductById(id);

        if (fetchedProduct) {
          setProduct(fetchedProduct);
        } else {
          console.log('Product not found');
          setProduct(null);
        }
      }

      setLoading(false);
    };

    if (id) {
      loadProduct();
    }
  }, [id, products, fetchProductById]);

  useEffect(() => {
    if (products.length > 0 && product) {
      let productsCopy = products.filter(
        (item) => product.TIPO_PRODUCTO === item.TIPO_PRODUCTO && item.ID_PRODUCTO !== product.ID_PRODUCTO
      );
      setRelatedProducts(productsCopy.slice(0, 5));
    }
  }, [products, product]);

  if (loading) {
    return (
      <div className='mt-16 text-center'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4'></div>
          <div className='h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8'></div>
          <div className='flex flex-col lg:flex-row gap-12'>
            <div className='lg:w-1/2'>
              <div className='h-96 bg-gray-200 rounded-xl'></div>
            </div>
            <div className='lg:w-1/2'>
              <div className='space-y-4'>
                <div className='h-4 bg-gray-200 rounded w-1/4'></div>
                <div className='h-8 bg-gray-200 rounded w-3/4'></div>
                <div className='h-4 bg-gray-200 rounded w-full'></div>
                <div className='h-4 bg-gray-200 rounded w-2/3'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className='mt-16 text-center'>
          <p className='text-xl text-gray-500 mb-4'>Producto no encontrado</p>
          <button
            onClick={() => navigate('/all-products')}
            className='px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition'
          >
            Ver todos los productos
          </button>
        </div>
    );
  }

  return (
    <div className='mt-12'>
      {/* Breadcrumb */}
      <p className='text-sm text-gray-500 mb-6'>
        <Link to='/' className='hover:text-sky-500'>
          Inicio
        </Link>{' '}
        /
        <Link to='/all-products' className='hover:text-sky-500'>
          {' '}
          Productos
        </Link>{' '}
        /
        <Link
          to={/product-category/}
          className='hover:text-sky-500'
        >
          {' '}
          {product.TIPO_PRODUCTO}
        </Link>{' '}
  /<span className='text-sky-500'> {product.NOMBRE_PRODUCTO}</span>
      </p>

      {/* Botón de regreso */}
      <button
        onClick={() => window.history.back()}
        className='flex items-center gap-2 text-gray-600 hover:text-sky-500 transition mb-6'
      >
        <ArrowLeft className='w-4 h-4' />
        Volver
      </button>

      <div className='flex flex-col lg:flex-row gap-12'>
        {/* Imagen principal */}
        <div className='lg:w-1/2'>
          <div className='relative rounded-xl overflow-hidden shadow-lg'>
              <img
              src={product.IMAGEN_URL || '/placeholder.jpg'}
              alt={product.NOMBRE_PRODUCTO}
              className='w-full h-96 object-cover'
            />
          </div>
        </div>

        {/* Información del producto */}
        <div className='lg:w-1/2'>
          <div className='mb-4'>
            <span className='text-sm text-sky-500 font-medium uppercase tracking-wide'>
              {product.TIPO_PRODUCTO}
            </span>
          </div>

          <h1 className='text-3xl lg:text-4xl font-bold text-gray-800 mb-4'>
            {product.NOMBRE_PRODUCTO}
          </h1>

          {/* Rating simulado */}
          <div className='flex items-center gap-1 mb-6'>
            {Array(5)
              .fill('')
              .map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            <span className='text-gray-600 ml-2'>(4.0) · 127 valoraciones</span>
          </div>

          <p className='text-gray-600 text-lg leading-relaxed mb-8'>
            {product.DESCRIPCION}
          </p>

            <div className='text-2xl font-bold text-sky-600 mb-6'>Q{product.PRECIO?.toFixed(2)}</div>

          {/* Botones de acción */}
          <div className='flex flex-col sm:flex-row gap-4 mb-8 items-center'>
            <div className='flex items-center gap-2'>
              <label className='text-sm text-gray-600'>Cantidad</label>
              <input type='number' min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))} className='w-20 p-2 border rounded' />
            </div>

            <button onClick={() => addToCart(product, qty)} className='flex-1 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition font-medium'>
              Agregar al Carrito
            </button>
          </div>
        </div>
      </div>

      {/* Productos relacionados */}
      {relatedProducts.length > 0 && (
        <div className='mt-16'>
          <h2 className='text-2xl font-bold mb-8'>Productos Relacionados</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
            {relatedProducts.map((product, index) => (
              <ProductCard key={index} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
