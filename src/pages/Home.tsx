import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import { useProductData } from "../hooks/useProductData";
import { useServerStatus } from "../hooks/useServerStatus";
import { useSearchHistory } from "../hooks/useLocalStorage";
import QRCapture from "../components/QRCapture";
import ProductInfo from "../components/ProductInfo";
import toast, { Toaster } from "react-hot-toast";
import type { Rule } from "../api/odooService";
import Cuadrado from "../assets/Cuadrado.png";
import Logo from "../assets/BLANCO_KDOSH.png";

const Home: React.FC = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [bestPrice, setBestPrice] = useState<number | null>(null);
  const [appliedRule, setAppliedRule] = useState<{
    fixed_price?: number;
    percent_price?: number;
  }>();

  const {
    product,
    loading,
    error,
    searchProduct,
    getBestPrice,
    clearData,
    clearError,
  } = useProductData();

  const { isOnline } = useServerStatus();
  const { addToHistory } = useSearchHistory();

  const handleCodeDetected = useCallback(
    (code: string) => {
      setIsCameraActive(false);

      if (isOnline && !loading) {
        searchProduct(code);
        addToHistory(code);
      }
    },
    [isOnline, loading, searchProduct, addToHistory, setIsCameraActive]
  );

  useEffect(() => {
    if (product) {
      getBestPrice(quantity).then(({ price, rule }) => {
        setBestPrice(price);
        setAppliedRule(rule || undefined);
      });
    }
  }, [product, quantity, getBestPrice]);

  useEffect(() => {
    if (product?.rules_by_application) {
      const allRules: Rule[] = [
        ...product.rules_by_application.product_template,
        ...product.rules_by_application.product_variant,
        ...product.rules_by_application.category,
        ...product.rules_by_application.global,
      ];
      const futureDiscounts = allRules.filter((r: Rule) => r.min_quantity > 1);
      toast.remove();
      futureDiscounts.forEach((rule) => {
        const id = `discount-${rule.id || rule.min_quantity}-${
          rule.fixed_price || rule.percent_price
        }`;
        toast.custom(
          (t) => (
            <div className="bg-white border border-green-400 rounded shadow p-2 flex flex-col gap-1 min-w-[180px] max-w-[240px]">
              <div className="text-xs flex items-center gap-1">
                <span role="img" aria-label="idea">
                  💡
                </span>
                {rule.fixed_price && rule.fixed_price > 0 ? (
                  <>
                    <b>Con {rule.min_quantity}</b>u. a{" "}
                    <b>S/ {rule.fixed_price.toFixed(2)}</b>
                  </>
                ) : rule.percent_price && rule.percent_price > 0 ? (
                  <>
                    <b>Con {rule.min_quantity}</b>u.{" "}
                    <b>{rule.percent_price}% desc.</b>
                  </>
                ) : null}
              </div>
              <button
                className="bg-green-500 hover:bg-green-600 text-white rounded text-xs px-2 py-1 font-semibold mt-1 cursor-pointer"
                style={{ lineHeight: "1.1" }}
                onClick={() => {
                  setQuantity(rule.min_quantity);
                  toast.remove(t.id);
                }}
              >
                Ver x {rule.min_quantity} unidades
              </button>
              <button
                className="text-[10px] text-gray-500 underline self-end mt-1 cursor-pointer"
                onClick={() => toast.remove(t.id)}
              >
                Cerrar
              </button>
            </div>
          ),
          { id, duration: Infinity }
        );
      });
    }
  }, [product]);

  const handleClearAll = () => {
    toast.remove();
    clearData();
    setIsCameraActive(false);
    setQuantity(1);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0097D4" }}
    >
      {/* Header */}
      <header className="py-4">
        <div className="max-w-6xl mx-auto px-4 text-center mb-4">
          <img
            src={Logo}
            alt="Logo"
            className="mx-auto mb-4"
            style={{ width: "150px", height: "auto" }}
          />
          <h1 className="text-[25px] font-semibold text-white mb-2 flex items-center justify-center">
            <span className="ml-2">DESCUBRE TU DESCUENTO</span>
          </h1>
          <p className="text-white mx-16 font-semibold">
            Escanea el código QR del producto y mira cuánto ahorras.
          </p>
        </div>
      </header>

      {/* Contenido principal */}
      <main
        className="flex-1 flex items-center justify-center"
        style={{
          backgroundImage: `url(${Cuadrado})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "calc(100vh - 200px)",
        }}
      >
        <Toaster position="top-right" />
        <div className="max-w-6xl w-full px-4 flex flex-col items-center justify-center">
          <div className="mb-8 w-full flex flex-col items-center justify-center">
            <div
              className="bg-transparent rounded-lg p-6 max-w-md w-full mx-auto"
              style={{ boxShadow: "none", border: "none" }}
            >
              <div className="my-4 text-center font-bold text-lg">
                {isOnline ? (
                  <div className="text-green-600">
                    <p>SISTEMA ACTIVO</p>
                    <p>¡PUEDES ESCANEAR!</p>
                  </div>
                ) : (
                  <p className="text-red-600">SISTEMA INACTIVO</p>
                )}
              </div>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mb-4"></div>
                  <p className="text-gray-600 font-medium">
                    Buscando producto...
                  </p>
                </div>
              ) : !product ? (
                <QRCapture
                  onCodeDetected={handleCodeDetected}
                  isActive={isCameraActive}
                  onToggle={() => setIsCameraActive(!isCameraActive)}
                />
              ) : (
                <div
                  onClick={handleClearAll}
                  className={`
                    flex items-center justify-center mx-auto
                    bg-sky-400
                    }
                    transition-colors
                    w-20 h-20
                    my-4
                    select-none
                    relative
                  `}
                >
                  {/* Cuadrado intermedio blanco */}
                  <div className="absolute left-1/2 top-1/2 z-10 h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 bg-white" />
                  {/* Cuadrado pequeño del mismo color */}
                  <div className="absolute left-1/2 top-1/2 z-20 h-[40px] w-[40px] -translate-x-1/2 -translate-y-1/2 bg-sky-400" />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 text-sm underline cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}

          {product && (
            <ProductInfo
              product={product}
              quantity={quantity}
              bestPrice={bestPrice}
              onClearData={handleClearAll}
              appliedRule={appliedRule}
              loading={loading}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <div className="max-w-6xl mx-auto px-[22px] align-center">
          <p className="text-white text-sm leading-relaxed font-semibold">
            © 2025 KDOSH STORE S.A.C.
            <br />
            Todos los derechos reservados. Esta plataforma es una herramienta
            informativa para uso exclusivo de tiendas fisicas KDOSH. Los precios
            y descuentos mostrados están sujetos a disponibilidad de stock y
            pueden variar sin previo aviso. El escaneo de productos no
            constituye una reserva ni garantiza la compra del artículo. KDOSH
            STORE S.A.C. no se responzabiliza por errores de visualización
            ocasionados por fallas de conexión o problemas técnicos. Al usar
            esta herramienta, aceptas los términos y condiciones de uso
            establecidos por la empresa.
            <br />
            <br />
            <span className="text-xl font-normal">MCMLXXXIX</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
