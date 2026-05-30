export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FC' }}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: '#5B5EF4', borderTopColor: 'transparent' }} />
        <p className="text-sm font-medium" style={{ color: '#64748B' }}>
          Loading NOVA...
        </p>
      </div>
    </div>
  );
}
