import { LegalLayout } from "../componentes/legal-layout";

export const metadata = {
  title: "Política de Reembolsos — MenuPro",
  description:
    "Política de devoluciones, cancelaciones y períodos de prueba aplicable a las suscripciones de MenuPro conforme al Código de Protección y Defensa del Consumidor del Perú.",
};

export default function ReembolsosPage() {
  return (
    <LegalLayout
      title="Política de Reembolsos y Cancelaciones"
      lastUpdated="28 de julio, 2026"
      description="Esta política detalla las condiciones bajo las cuales puedes solicitar un reembolso por cargos de suscripción a MenuPro, conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571)."
    >
      <h2>1. Período de prueba gratuito</h2>
      <p>
        MenuPro ofrece un Plan Free sin costo, con funcionalidades limitadas,
        permanente. No requiere tarjeta de crédito. Te recomendamos usar el Plan
        Free durante el tiempo que necesites para evaluar si la plataforma se ajusta
        a tu negocio antes de contratar un plan de pago.
      </p>
      <p>
        Adicionalmente, todos los planes de pago incluyen una garantía de
        satisfacción de <strong>7 días calendario</strong> desde el primer pago. Si
        dentro de esos 7 días solicitas cancelar y reembolsar, devolvemos el 100%
        del monto pagado sin preguntas.
      </p>

      <h2>2. Cancelación de la suscripción</h2>
      <p>
        Puedes cancelar tu suscripción en cualquier momento desde{" "}
        <a href="/dashboard/billing">Panel → Facturación → Cancelar suscripción</a>.
        La cancelación surte efecto al final del ciclo de pago en curso (mensual o
        anual). Hasta esa fecha, conservas acceso a todas las funciones de tu plan.
      </p>
      <p>
        Tras la cancelación, tu cuenta vuelve automáticamente al Plan Free. Tus
        menús, productos e imágenes permanecen accesibles, pero las funciones Pro y
        Full (quitar fondo con IA, módulo de mozos avanzado, etc.) se desactivan
        hasta que reactives la suscripción.
      </p>

      <h2>3. Reembolsos</h2>

      <h3>3.1 Reembolsos elegibles</h3>
      <ul>
        <li>
          <strong>Primer pago</strong> dentro de los 7 días calendario posteriores:
          100% del monto.
        </li>
        <li>
          <strong>Cargo duplicado</strong> por error del sistema: 100% del cargo
          duplicado.
        </li>
        <li>
          <strong>Servicio no prestado</strong> (interrupción mayor a 48 horas
          consecutivas atribuible a MenuPro dentro del ciclo de pago): proporcional
          al tiempo de indisponibilidad.
        </li>
        <li>
          <strong>Cargo tras cancelación efectiva</strong>: 100% del cargo erróneo.
        </li>
      </ul>

      <h3>3.2 Reembolsos NO elegibles</h3>
      <ul>
        <li>
          Ciclos de pago posteriores al primero, salvo los casos previstos en 3.1.
        </li>
        <li>
          Insatisfacción por cambios en la plataforma comunicados con el preaviso de
          30 días establecido en los Términos de Servicio.
        </li>
        <li>
          Límites alcanzados del plan contratado (cantidad de menús, platos,
          imágenes, créditos de quitar-fondo, mozos, mesas, sucursales). Estos
          límites son públicos y verificables antes de contratar.
        </li>
        <li>
          Suspensión por incumplimiento de los Términos de Servicio (uso ilícito,
          impago, etc.).
        </li>
        <li>
          Planes anuales cancelados después de los primeros 7 días: no reembolsable,
          pero el cliente conserva acceso hasta el final del año contratado.
        </li>
      </ul>

      <h3>3.3 Cómo solicitar un reembolso</h3>
      <p>
        Envía un correo a{" "}
        <a href="mailto:reembolsos@menudigital.pro">reembolsos@menudigital.pro</a>{" "}
        con los siguientes datos:
      </p>
      <ul>
        <li>Correo asociado a tu cuenta MenuPro.</li>
        <li>Número de operación MercadoPago (lo encuentras en tu panel de MercadoPago o en el correo de confirmación).</li>
        <li>Motivo del reembolso (uno de los supuestos de la sección 3.1).</li>
        <li>Fecha del cargo.</li>
      </ul>
      <p>
        Atenderemos tu solicitud en un plazo máximo de <strong>5 días hábiles</strong>.
        Los reembolsos aprobados se emiten por el mismo medio de pago utilizado en la
        compra (MercadoPago) y pueden tardar hasta 10 días hábiles adicionales en
        reflejarse en tu cuenta, dependiendo de tu banco emisor.
      </p>

      <h2>4. Disputas y chargebacks</h2>
      <p>
        Si tienes un problema con un cobro, te pedimos que primero nos contactes a{" "}
        <a href="mailto:reembolsos@menudigital.pro">reembolsos@menudigital.pro</a>.
        Initiate un dispute o chargeback directamente en MercadoPago sin habernos
        notificado puede demorar la resolución y, en algunos casos, ocasionar la
        suspensión preventiva de la cuenta mientras se resuelve la disputa.
      </p>
      <p>
        Si el chargeback se resuelve a tu favor, te reembolsamos el 100%. Si se
        resuelve a favor de MenuPro y se demuestra que el cargo era legítimo, la
        cuenta queda sujeta a las consecuencias previstas en los Términos de
        Servicio.
      </p>

      <h2>5. Derechos del consumidor</h2>
      <p>
        Esta Política de Reembolsos no limita los derechos que te asisten como
        consumidor bajo el Código de Protección y Defensa del Consumidor (Ley N°
        29571) y demás normas peruanas aplicables. En particular, conservas el
        derecho a presentar reclamaciones ante el Instituto Nacional de Defensa de
        la Competencia y de la Protección de la Propiedad Intelectual (INDECOPI).
      </p>

      <h2>6. Contacto</h2>
      <p>
        Para cualquier consulta relacionada con reembolsos, escríbenos a{" "}
        <a href="mailto:reembolsos@menudigital.pro">reembolsos@menudigital.pro</a>{" "}
        o por WhatsApp al{" "}
        <a href="https://wa.me/51987654321" target="_blank" rel="noreferrer">
          +51 987 654 321
        </a>.
      </p>
    </LegalLayout>
  );
}
