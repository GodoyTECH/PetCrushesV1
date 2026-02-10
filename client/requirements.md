## Packages
framer-motion | Page transitions and complex animations for the "wow" factor
react-hook-form | Form state management
@hookform/resolvers | Zod integration for forms
clsx | Utility for conditional classes
tailwind-merge | Utility for merging tailwind classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
}
Authentication uses Replit Auth via use-auth hook.
Pet photos will use Unsplash placeholders for demo purposes if upload returns mock URLs.
Sales keywords (selling, price, R$, etc.) are strictly blocked on the client side before submission.
