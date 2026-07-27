import { LegalLayout } from "../componentes/legal-layout";

export const metadata = {
  title: "Términos de Servicio — MenuPro",
  description:
    "Términos y condiciones de uso de la plataforma MenuPro, suscripciones, obligaciones del usuario y limitaciones de responsabilidad.",
};

export default function TerminosPage() {
  return (
    <LegalLayout
      title="Términos de Servicio"
      lastUpdated="28 de julio, 2026"
      description="Estos Términos rigen tu uso de MenuPro como restaurante, negocio o usuario final. Al registrarte y usar la plataforma, aceptas quedar vinculado por ellos."
    >
      <h2>1. Aceptación de los términos</h2>
      <p>
        Al crear una cuenta, acceder al panel de control o utilizar cualquiera de las
        herramientas de MenuPro (incluidos el editor de menús, generador de QR,
        módulo de mozos, inventario, comandas y reportes), aceptas quedar vinculado
        por estos Términos de Servicio y por nuestra <a href="/legal/privacidad">Política de Privacidad</a>.
        Si no estás de acuerdo con alguna cláusula, no debes usar la plataforma.
      </p>
      <p>
        Si usas MenuPro en representación de una empresa o negocio (por ejemplo, como
        administrador de uno o varios restaurantes), declaras tener la autoridad
        necesaria para vincular a esa organización con estos términos.
      </p>

      <h2>2. Definiciones</h2>
      <ul>
        <li>
          <strong>“MenuPro”, “nosotros”, “la plataforma”</strong>: el servicio SaaS
          operado por FastPagePro, proveedor de soluciones digitales con sede en Lima, Perú.
        </li>
        <li>
          <strong>“Cliente”, “tú”, “el usuario”</strong>: la persona natural o jurídica
          que contrata MenuPro para administrar su carta digital y operaciones de
          restaurante.
        </li>
        <li>
          <strong>“Plan”</strong>: la suscripción contratada (Free, Pro o Full), con
          los límites y funcionalidades descritos en la página de{" "}
          <a href="/#pricing">precios</a>.
        </li>
        <li>
          <strong>“Contenido del cliente”</strong>: textos, imágenes, logotipos,
          precios, datos de productos y cualquier otra información que el cliente
          cargue a la plataforma.
        </li>
        <li>
          <strong>“Usuarios finales”</strong>: los comensales que escanean un QR,
          consultan la carta pública o hacen pedidos a través del módulo de mozos.
        </li>
      </ul>

      <h2>3. Cuentas y responsabilidad del cliente</h2>
      <p>
        Eres responsable de mantener la confidencialidad de tus credenciales de acceso
        y de todas las actividades que ocurran bajo tu cuenta. Debes notificarnos de
        inmediato cualquier uso no autorizado mediante{" "}
        <a href="mailto:soporte@menudigital.pro">soporte@menudigital.pro</a>.
      </p>
      <p>
        El cliente es el único responsable del Contenido del cliente, incluyendo su
        precisión, licencia de uso de imágenes (fotografías de platos, logotipos de
        marca, etc.), precios publicados y descripciones de productos. MenuPro no
        revisa ni aprueba el contenido cargado por cada cliente; actúa como
        intermediario técnico.
      </p>
      <p>
        Te comprometes a no usar MenuPro para: (i) publicar contenido falso, engañoso
        o que infrija derechos de terceros; (ii) vender o promover productos
        prohibidos por la legislación peruana; (iii) intentar acceder a cuentas,
        datos o menús de otros clientes sin autorización; (iv) realizar ingeniería
        inversa, scraping o extracción masiva de la plataforma; o (v) introducir
        malware o realizar actividades que comprometan la seguridad del servicio.
      </p>

      <h2>4. Planes, precios y facturación</h2>
      <p>
        Los precios y límites de cada plan están publicados en{" "}
        <a href="/#pricing">nuestra página de precios</a> y pueden actualizarse con
        un preaviso de 30 días calendario. Las suscripciones se cobran mensualmente
        mediante MercadoPago, salvo que se contrate un plan anual con descuento.
      </p>
      <p>
        Los límites de cada plan (cantidad de menús, platos, imágenes, mozos, mesas,
        sucursales y créditos mensuales de quitar-fondo con IA) son acumulativos por
        cuenta, no por usuario. Cuando se alcanza un límite, la funcionalidad
        correspondiente se bloquea hasta el siguiente ciclo de facturación o hasta
        que se amplíe el plan.
      </p>
      <p>
        Los créditos mensuales no consumidos (por ejemplo, créditos de
        quitar-fondo) no se acumulan al mes siguiente.
      </p>
      <p>
        Para detalles sobre cancelaciones y devoluciones, consulta nuestra{" "}
        <a href="/legal/reembolsos">Política de Reembolsos</a>.
      </p>

      <h2>5. Uso aceptable de la API de MercadoPago</h2>
      <p>
        Los pagos de suscripción se procesan a través de MercadoPago. MenuPro no
        almacena datos de tarjetas: toda la información sensible viaja cifrada y se
        procesa en los servidores certificados PCI-DSS de MercadoPago. El cliente
        acepta quedar sujeto, además, a los{" "}
        <a
          href="https://www.mercadopago.com.pe/terminos-y-condiciones"
          target="_blank"
          rel="noreferrer"
        >
          Términos y Condiciones de MercadoPago
        </a>
        .
      </p>

      <h2>6. Propiedad intelectual</h2>
      <p>
        MenuPro, su código, diseño, marca, logotipos, ilustraciones y la documentación
        son propiedad de FastPagePro y están protegidos por las leyes peruanas e
        internacionales de propiedad intelectual. No se concede al cliente ninguna
        licencia sobre la plataforma más allá del derecho limitado, no exclusivo y
        revocable de usarla conforme a estos Términos.
      </p>
      <p>
        El Contenido del cliente mantiene su titularidad en manos del cliente. Al
        cargarlo, el cliente otorga a MenuPro una licencia no exclusiva, mundial y
        gratuita para alojarlo, mostrarlo y procesarlo con el único fin de prestar el
        servicio. Esta licencia se extingue al eliminar el contenido o cancelar la
        cuenta, salvo por copias residuales en backups (ver Política de Privacidad).
      </p>

      <h2>7. Plan Free y marca MenuPro</h2>
      <p>
        El Plan Free incluye el badge “Hecho con MenuPro” visible en las cartas
        públicas y en los QR generados. Los planes Pro y Full permiten ocultar esta
        marca (white-label) siempre que la suscripción esté activa. Si la
        suscripción se cancela y la cuenta vuelve al Plan Free, el badge se mostrará
        nuevamente.
      </p>

      <h2>8. Disponibilidad del servicio</h2>
      <p>
        MenuPro se esfuerza por mantener una disponibilidad de 99.5% mensual,
        excluyendo ventanas de mantenimiento programado comunicadas con al menos 24
        horas de anticipación. No nos hacemos responsables de interrupciones
        causadas por: (i) fallas en proveedores externos (Supabase, Vercel,
        MercadoPago, proveedores de internet); (ii) ataques de denegación de
        servicio; o (iii) fuerza mayor (eventos climáticos, decisiones
        gubernamentales, etc.).
      </p>
      <p>
        En caso de interrupciones mayores a 4 horas consecutivas atribuibles a
        MenuPro, el cliente con plan de pago podrá solicitar un crédito
        proporcional equivalente al tiempo de indisponibilidad.
      </p>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        En la máxima medida permitida por la ley, MenuPro no será responsable de
        daños indirectos, incidentales, consecuentes, especiales o punitivos,
        incluyendo pero no limitándose a pérdida de ingresos, pérdida de clientes,
        pérdida de datos o interrupción del negocio. La responsabilidad total
        acumulada de MenuPro frente a un cliente no excederá el monto pagado por ese
        cliente en los 3 meses anteriores al evento que originó el reclamo.
      </p>

      <h2>10. Suspensión y cancelación</h2>
      <p>
        El cliente puede cancelar su suscripción en cualquier momento desde el panel
        de facturación. La cancelación surte efecto al final del ciclo de pago en
        curso; el cliente mantiene acceso a las funciones Pro/Full hasta esa fecha.
      </p>
      <p>
        MenuPro puede suspender o cancelar una cuenta en caso de: (i) incumplimiento
        grave de estos Términos; (ii) uso de la plataforma para actividades
        ilícitas; o (iii) impago de la suscripción por más de 15 días. En esos casos,
        se otorgará un plazo razonable para que el cliente descargue su Contenido del
        cliente antes de la baja definitiva.
      </p>

      <h2>11. Modificaciones a estos Términos</h2>
      <p>
        Podemos actualizar estos Términos periódicamente. Los cambios materiales se
        comunicarán por correo electrónico al titular de la cuenta con al menos 30
        días de anticipación. El uso continuado de MenuPro después de la fecha
        efectiva del cambio constituye la aceptación de los nuevos Términos.
      </p>

      <h2>12. Ley aplicable y jurisdicción</h2>
      <p>
        Estos Términos se rigen por las leyes de la República del Perú. Cualquier
        controversia se resolverá preferentemente mediante conciliación extrajudicial.
        De no llegarse a acuerdo, las partes se someten a la jurisdicción de los
        jueces y tribunales del distrito judicial de Lima.
      </p>

      <h2>13. Contacto</h2>
      <p>
        Para consultas legales, contratos empresariales o acuerdos de nivel de
        servicio (SLA), escríbenos a{" "}
        <a href="mailto:legal@menudigital.pro">legal@menudigital.pro</a>.
      </p>
    </LegalLayout>
  );
}
