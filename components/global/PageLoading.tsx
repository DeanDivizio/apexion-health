export default function PageLoading() {
    return (
        <div className="fixed inset-0 grid place-items-center bg-black text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="h-14 w-14 rounded-2xl border-4 border-white/70 border-t-transparent animate-spin" />
                <p className="text-sm font-semibold tracking-wide text-white/90">Apexion Health</p>
            </div>
        </div>
    )
}