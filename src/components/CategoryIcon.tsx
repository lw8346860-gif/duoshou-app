import type { Category } from '../types';

const iconPaths: Record<string, string[]> = {
  'cat-digital': ['M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z', 'M10 17h4'],
  'cat-car': ['M5 15h14l-1.6-5.2A3 3 0 0 0 14.5 8h-5a3 3 0 0 0-2.9 1.8L5 15Z', 'M7 15v2M17 15v2M8 12h8'],
  'cat-luxury': ['M12 4l6 5-6 11L6 9l6-5Z', 'M6 9h12M9 9l3 11 3-11'],
  'cat-watch': ['M9 4h6l1 4a5 5 0 0 1 0 8l-1 4H9l-1-4a5 5 0 0 1 0-8l1-4Z', 'M12 9v3l2 1'],
  'cat-bag': ['M6 9h12l-1 10H7L6 9Z', 'M9 9V7a3 3 0 0 1 6 0v2'],
  'cat-jewelry': ['M12 5l5 5-5 9-5-9 5-5Z', 'M8 10h8'],
  'cat-clothing': ['M9 5l3 2 3-2 4 4-2 2-1-1v9H8v-9l-1 1-2-2 4-4Z'],
  'cat-shoes': ['M5 15c4 1 9 1 14 0v2H5v-2Z', 'M7 15l2-6 5 4 5 2'],
  'cat-camera': ['M5 8h4l1.2-2h3.6L15 8h4v10H5V8Z', 'M12 11a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z'],
  'cat-gaming': ['M7 10h10a4 4 0 0 1 3.5 6l-.5 1a2 2 0 0 1-3.2.4L15 16H9l-1.8 1.4A2 2 0 0 1 4 17l-.5-1A4 4 0 0 1 7 10Z', 'M8 13v3M6.5 14.5h3M15 14h.1M17 13h.1'],
  'cat-appliance': ['M6 5h12v14H6V5Z', 'M9 8h6M9 11h6M12 15h.1'],
  'cat-furniture': ['M6 10h12v7H6v-7Z', 'M8 10V7h8v3M8 17v2M16 17v2'],
  'cat-subscription': ['M5 7h14v10H5V7Z', 'M5 10h14M8 14h4'],
  'cat-collectible': ['M8 8l4-3 4 3v9l-4 3-4-3V8Z', 'M8 8l4 3 4-3M12 11v9'],
  'cat-tool': ['M14 5l5 5-3 3-2-2-6 6-3-3 6-6-2-2 3-3Z'],
  'cat-office': ['M7 8h10v11H7V8Z', 'M9 8V6h6v2M7 12h10'],
  'cat-sports': ['M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z', 'M7 12h10M12 5c2 2 2 12 0 14M12 5c-2 2-2 12 0 14'],
  'cat-other': ['M6 7h12v12H6V7Z', 'M9 7V5h6v2M9 11h6M9 15h4'],
};

interface CategoryIconProps {
  category?: Pick<Category, 'id' | 'name' | 'icon'> | null;
  className?: string;
}

export default function CategoryIcon({ category, className = '' }: CategoryIconProps) {
  const paths = category ? iconPaths[category.id] : undefined;

  if (!paths) {
    return (
      <span className={`category-icon ${className}`} aria-hidden="true">
        <span className="category-icon-fallback">{category?.name?.slice(0, 1) || '剁'}</span>
      </span>
    );
  }

  return (
    <span className={`category-icon ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        {paths.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </svg>
    </span>
  );
}
