import * as React from "react"

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' }
>(({ className, variant = 'default', ...props }, ref) => {
  const variantClasses = variant === 'destructive'
    ? 'border-red-500/50 text-red-600 dark:border-red-500 [&>svg]:text-red-600'
    : 'bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-50'

  return (
    <div
      ref={ref}
      role="alert"
      className={`relative w-full rounded-lg border border-slate-200 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-slate-950 ${variantClasses} ${className || ''}`}
      {...props}
    />
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={`mb-1 font-medium leading-none tracking-tight ${className || ''}`}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm [&_p]:leading-relaxed ${className || ''}`}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
