interface AvatarProps {
  gender: 'male' | 'female';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar = ({ gender, size = 'md', className = '' }: AvatarProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const MaleAvatar = () => (
    <svg viewBox="0 0 100 100" className={`${sizeClasses[size]} ${className}`} aria-label="صورة افتراضية - ذكر">
      <circle cx="50" cy="50" r="50" fill="#E6EAEF" />
      <circle cx="50" cy="35" r="18" fill="#1E3A8A" />
      <path d="M 20 80 Q 20 60 50 60 Q 80 60 80 80 L 80 100 L 20 100 Z" fill="#1E3A8A" />
    </svg>
  );

  const FemaleAvatar = () => (
    <svg viewBox="0 0 100 100" className={`${sizeClasses[size]} ${className}`} aria-label="صورة افتراضية - أنثى">
      <circle cx="50" cy="50" r="50" fill="#F3F6F9" />
      <circle cx="50" cy="35" r="18" fill="#7C3AED" />
      <path d="M 20 80 Q 20 60 50 60 Q 80 60 80 80 L 80 100 L 20 100 Z" fill="#7C3AED" />
    </svg>
  );

  return gender === 'male' ? <MaleAvatar /> : <FemaleAvatar />;
};
