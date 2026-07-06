import { VoiceTestCockpit } from '@/components/admin/VoiceTestCockpit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function AdminVoiceTestPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Voice-Test</h1>
        <p className="mt-1 text-sm text-gray-500">Durchwahlen „anrufen", per Mikro sprechen, Antworten hören — testet Dialog + echte /voice-Endpunkte im Browser.</p>
      </div>
      <VoiceTestCockpit />
    </div>
  )
}
