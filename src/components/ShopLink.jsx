export default function ShopLink({ children = 'Support me - Buy a Sauna Hat', className = '' }) {
  return <a href="https://koriboshi.com" target="_blank" rel="noopener noreferrer"
    className={`text-xs text-warm-gray hover:text-charcoal transition-colors ${className}`}>
    {children}
  </a>;
}
