import { LegalLayout } from "../componentes/legal-layout";

export const metadata = {
  title: "Política de Privacidad — MenuPro",
  description:
    "Cómo MenuPro recopila, usa, almacena y protege los datos personales de clientes y usuarios finales, conforme a la Ley 29733 de Protección de Datos Personales del Perú.",
};

export default function PrivacidadPage() {
  return (
    <LegalLayout
      title="Política de Privacidad"
      lastUpdated="28 de julio, 2026"
      description="Cumplimos con la Ley N° 29733 (Ley de Protección de Datos Personales del Perú) y su Reglamento (D.S. 003-2013-JUS). Aquí explicamos qué datos recogemos, para qué, con quién los compartimos y cómo ejercer tus derechos ARCO."
    >
      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento de los datos personales recopilados a través
        de MenuPro es <strong>FastPagePro</strong>, con domicilio fiscal en Lima,
        Perú. Puedes contactarnos escribiendo a{" "}
        <a href="mailto:privacidad@menudigital.pro">privacidad@menudigital.pro</a>.
      </p>
      <p>
        MenuPro está inscrito como encargado del tratamiento ante los clientes que
        actúan como titulares de los datos de sus comensales y mozos. Es decir,
        cuando un restaurante usa MenuPro para registrar pedidos de comensales o
        datos de mozos, el responsable de esos datos es el restaurante, y MenuPro
        actúa como proveedor técnico bajo sus instrucciones.
      </p>

      <h2>2. Datos que recopilamos</h2>

      <h3>2.1 Datos del cliente (titular de la cuenta)</h3>
      <ul>
        <li>Nombre, correo electrónico y contraseña (cifrada con bcrypt).</li>
        <li>Teléfono (opcional) y nombre del negocio.</li>
        <li>Datos de facturación (RUC o DNI, dirección fiscal).</li>
        <li>Historial de pagos procesados por MercadoPago (sin datos de tarjetas).</li>
        <li>Contenido del cliente: menús, productos, imágenes, precios, configuración de tema.</li>
        <li>Datos operacionales: sucursales, mesas, mozos, comandas, inventario.</li>
      </ul>

      <h3>2.2 Datos del mozo (usuario interno del cliente)</h3>
      <ul>
        <li>Nombre completo, documento de identidad (DNI/CE), teléfono.</li>
        <li>PIN de acceso de 4 dígitos (cifrado hash) y token QR de acceso.</li>
        <li>Historial de comandas atendidas.</li>
      </ul>
      <p>
        El cliente es responsable de contar con la autorización expresa del mozo para
        tratar sus datos personales conforme al artículo 13 de la Ley 29733. MenuPro
        actúa como encargado y solo conserva estos datos mientras el cliente mantenga
        la cuenta activa o durante los plazos legales aplicables.
      </p>

      <h3>2.3 Datos del usuario final (comensal)</h3>
      <ul>
        <li>Datos ingresados voluntariamente al hacer un pedido: nombre, teléfono, productos seleccionados.</li>
        <li>Datos técnicos anónimos: dispositivo, navegador, dirección IP (por logs de seguridad, rotados en 30 días).</li>
        <li>Preferencias: idioma, tema claro/oscuro, mesa seleccionada.</li>
      </ul>
      <p>
        MenuPro no requiere registro de comensales para consultar la carta pública.
        Los datos de pedido se conservan mientras exista una comanda activa y 90
        días adicionales por temas de soporte, salvo que el cliente los elimine antes.
      </p>

      <h3>2.4 Datos técnicos y analíticos</h3>
      <ul>
        <li>Cookies esenciales: sesión de autenticación, preferencia de tema, recordatorio de menú visitado.</li>
        <li>Cookies analíticas (anónimas, agregadas): número de visitas, dispositivo, ubicación aproximada (país/región).</li>
        <li>Logs de errores y rendimiento: stack traces, ruta afectada, sin datos personales identificables.</li>
      </ul>

      <h2>3. Finalidades del tratamiento</h2>
      <p>Tratamos los datos personales únicamente para:</p>
      <ul>
        <li>Prestar el servicio contratado: editor de menús, módulo de mozos, comandas, inventario, reportes.</li>
        <li>Gestionar la autenticación, la sesión y la seguridad de la cuenta.</li>
        <li>Procesar pagos de suscripción a través de MercadoPago.</li>
        <li>Enviar notificaciones operacionales: confirmaciones de pago, alertas de seguridad, comunicados sobre cambios en el servicio.</li>
        <li>Enviar comunicaciones comerciales (solo si el cliente activó el consentimiento; puede revocarse en cualquier momento desde el panel).</li>
        <li>Cumplir obligaciones legales: conservación de comprobantes de pago, respuesta a requerimientos de SUNAT o autoridades competentes.</li>
        <li>Mejorar el producto: analítica agregada y anónima de uso, detección de bugs, optimización de rendimiento.</li>
      </ul>
      <p>
        No vendemos, alquilamos ni cedemos a terceros los datos personales de
        nuestros clientes o usuarios finales. Tampoco realizamos perfiles para
        decisiones automatizadas con efecto legal o significativo sobre el titular.
      </p>

      <h2>4. Base legal del tratamiento</h2>
      <p>
        El tratamiento de datos personales por parte de MenuPro se fundamenta en:
      </p>
      <ul>
        <li>
          <strong>Ejecución de un contrato</strong> (art. 7 literal a de la Ley
          29733): prestar el servicio SaaS contratado por el cliente.
        </li>
        <li>
          <strong>Consentimiento del titular</strong>: para comunicaciones
          comerciales, cookies no esenciales y tratamiento de datos de mozos.
        </li>
        <li>
          <strong>Obligación legal</strong>: conservación de registros fiscales y
          respuesta a requerimientos de autoridades competentes.
        </li>
        <li>
          <strong>Interés legítimo</strong>: prevención de fraude, seguridad de la
          plataforma y mejora del servicio.
        </li>
      </ul>

      <h2>5. Compartición con terceros</h2>
      <p>
        Compartimos datos personales únicamente con los siguientes proveedores,
        bajo contratos de encargamiento que garantizan un nivel adecuado de
        protección:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> ( hosting de base de datos PostgreSQL y
          autenticación, con servidores en São Paulo, Brasil — región aws-sa-east-1).
          Datos alojados: perfil, menús, comandas, mozos, inventario, imágenes en
          Storage.
        </li>
        <li>
          <strong>Vercel</strong> (hosting de la aplicación Next.js y edge network
          para servir la carta pública a los comensales).
        </li>
        <li>
          <strong>MercadoPago</strong> (procesamiento de pagos de suscripción; no
          reciben datos de comensales ni de mozos).
        </li>
        <li>
          <strong>Google</strong> (OAuth para login opcional con cuenta Google;
          solo reciben el correo y el nombre del cliente que elija esta opción).
        </li>
        <li>
          <strong>Resend</strong> (envío de correos transaccionales: confirmación
          de pago, restablecimiento de contraseña, bienvenida).
        </li>
        <li>
          <strong>Sentry</strong> (monitoreo de errores; recibe stack traces
          anónimos sin datos personales identificables).
        </li>
      </ul>
      <p>
        No transferimos datos personales a países fuera del Perú que no cuenten con
        un nivel adecuado de protección reconocido por la Autoridad Nacional de
        Protección de Datos. Brasil (Supabase) y Estados Unidos (Vercel, Sentry,
        Resend, Google) cuentan con salvaguardas apropiadas según el Reglamento de
        la Ley 29733.
      </p>

      <h2>6. Conservación de los datos</h2>
      <ul>
        <li>
          <strong>Datos de cuenta activa</strong>: mientras la suscripción esté
          activa o la cuenta Free tenga acceso.
        </li>
        <li>
          <strong>Tras cancelación</strong>: 90 días para permitir la descarga del
          Contenido del cliente por parte del titular. Luego, borrado permanente de
          la base de datos y del Storage.
        </li>
        <li>
          <strong>Backups encriptados</strong>: snapshots diarios de Supabase con
          retención de 7 días. Tras borrar una cuenta, los backups se purgan en el
          ciclo de 7 días.
        </li>
        <li>
          <strong>Comprobantes de pago</strong>: conservados 7 años conforme al
          Código Tributario peruano (art. 87).
        </li>
        <li>
          <strong>Logs de seguridad</strong>: 90 días.
        </li>
      </ul>

      <h2>7. Seguridad</h2>
      <p>
        Implementamos las siguientes medidas técnicas y organizativas:
      </p>
      <ul>
        <li>Cifrado TLS 1.3 en tránsito para todas las comunicaciones.</li>
        <li>Contraseñas de cliente hasheadas con bcrypt (cost factor 10) en Supabase Auth.</li>
        <li>PINs de mozos almacenados como hash SHA-256 con salt.</li>
        <li>Row Level Security (RLS) activado en todas las tablas de Supabase; ningún cliente puede acceder a datos de otro cliente.</li>
        <li>Rate limiting en endpoints sensibles (autenticación, webhook de MercadoPago, subida de imágenes).</li>
        <li>Backups automáticos cifrados en reposo (AES-256) con retención de 7 días.</li>
        <li>Auditoría de accesos administrativos a la base de datos (logs de Supabase).</li>
        <li>Revisión periódica de políticas RLS y de dependencias vulnerables (Dependabot).</li>
      </ul>
      <p>
        En caso de incidente de seguridad que afecte datos personales, notificaremos
        a la Autoridad Nacional de Protección de Datos y a los titulares afectados
        dentro de las 72 horas siguientes al descubrimiento, conforme al artículo 24
        del Reglamento de la Ley 29733.
      </p>

      <h2>8. Derechos ARCO del titular</h2>
      <p>
        Como titular de datos personales, puedes ejercer en cualquier momento los
        siguientes derechos:
      </p>
      <ul>
        <li><strong>Acceso</strong>: saber qué datos tuyos tenemos.</li>
        <li><strong>Rectificación</strong>: corregir datos inexactos o desactualizados.</li>
        <li><strong>Cancelación</strong>: solicitar el borrado de tus datos.</li>
        <li><strong>Oposición</strong>: oponerte al tratamiento para fines específicos (por ejemplo, marketing).</li>
        <li><strong>Portabilidad</strong>: recibir tus datos en formato estructurado (JSON/CSV).</li>
        <li><strong>Revocación del consentimiento</strong>: sin afectar la licitud del tratamiento previo.</li>
      </ul>
      <p>
        Para ejercer estos derechos, envía un correo a{" "}
        <a href="mailto:privacidad@menudigital.pro">privacidad@menudigital.pro</a>{" "}
        con asunto “Derechos ARCO”, indicando: nombre completo, documento de
        identidad, correo asociado a tu cuenta y el derecho que deseas ejercer.
        Atenderemos tu solicitud en un plazo máximo de 10 días hábiles conforme al
        artículo 31 del Reglamento.
      </p>

      <h2>9. Cookies</h2>
      <p>
        MenuPro utiliza cookies esenciales para el funcionamiento del servicio
        (sesión, preferencias de tema, recordatorio de menú). Estas no requieren
        consentimiento previo conforme al artículo 25 del Reglamento.
      </p>
      <p>
        Las cookies analíticas son anónimas y agregadas. Puedes desactivarlas desde
        la configuración de tu navegador sin que ello afecte la funcionalidad de la
        plataforma.
      </p>
      <p>
        No utilizamos cookies de publicidad de terceros ni seguimiento
        cross-site.
      </p>

      <h2>10. Privacidad de menores</h2>
      <p>
        MenuPro no está dirigido a menores de 18 años. No recopilamos
        conscientemente datos de menores. Si eres padre o tutor y detectas que un
        menor nos ha proporcionado datos, contáctanos para proceder a su borrado
        inmediato.
      </p>

      <h2>11. Cambios a esta política</h2>
      <p>
        Podemos actualizar esta Política de Privacidad cuando modifiquemos nuestras
        prácticas de tratamiento de datos o por requerimientos legales. Los cambios
        materiales se comunicarán por correo electrónico con al menos 30 días de
        anticipación.
      </p>

      <h2>12. Autoridad de control</h2>
      <p>
        Si consideras que no hemos atendido adecuadamente tu solicitud de derechos
        ARCO, puedes presentar una reclamación ante la Autoridad Nacional de
        Protección de Datos Personales del Ministerio de Justicia y Derechos Humanos
        del Perú (<a href="https://www.minjus.gob.pe/defensa-del-consumidor/" target="_blank" rel="noreferrer">www.minjus.gob.pe</a>).
      </p>
    </LegalLayout>
  );
}
