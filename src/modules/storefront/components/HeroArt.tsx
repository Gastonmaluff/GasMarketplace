/**
 * Ilustración on-brand del hero (sin fotos de stock): panel crema con motivo
 * "48", una bolsa de compras y una caja de envío. Solo decorativa.
 */
export function HeroArt() {
  return (
    <svg
      aria-hidden="true"
      className="hero__art"
      viewBox="0 0 460 360"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="hero-round">
          <rect height="360" rx="26" width="460" />
        </clipPath>
      </defs>
      <g clipPath="url(#hero-round)">
        <rect fill="var(--color-cream)" height="360" width="460" />
        <circle cx="360" cy="70" fill="var(--color-primary-soft)" r="150" opacity="0.5" />
        <circle cx="90" cy="300" fill="var(--color-primary-soft)" r="90" opacity="0.4" />

        {/* Marca 48 traslúcida de fondo */}
        <text
          fill="var(--color-primary)"
          fontFamily="Inter, sans-serif"
          fontSize="240"
          fontWeight="800"
          opacity="0.12"
          x="150"
          y="300"
        >
          48
        </text>

        {/* Caja de envío con sello 48 */}
        <g transform="translate(250 150)">
          <path d="M0 40 90 15l90 25v90l-90 25-90-25Z" fill="#c8a06a" />
          <path d="M0 40 90 65l90-25v90l-90 25Z" fill="#b98a4f" />
          <path d="M90 65v90l-90-25V40Z" fill="#a9793f" opacity="0.85" />
          <path d="M0 40 90 15l90 25-90 25Z" fill="#d8b884" />
          <circle cx="90" cy="95" fill="var(--color-primary)" r="26" />
          <text
            fill="#fff"
            fontFamily="Inter, sans-serif"
            fontSize="26"
            fontWeight="800"
            textAnchor="middle"
            x="90"
            y="104"
          >
            48
          </text>
        </g>

        {/* Bolsa de compras */}
        <g transform="translate(70 120)">
          <path
            d="M10 60h120l-12 150a14 14 0 0 1-14 12H36a14 14 0 0 1-14-12Z"
            fill="var(--color-primary)"
          />
          <path
            d="M40 60c0-30 12-46 30-46s30 16 30 46"
            fill="none"
            stroke="var(--color-primary-dark)"
            strokeWidth="7"
          />
          <rect
            fill="var(--color-cream)"
            height="26"
            rx="13"
            width="70"
            x="35"
            y="120"
            opacity="0.85"
          />
        </g>
      </g>
    </svg>
  );
}
