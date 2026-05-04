import { LpHero } from './LpHero'
import { LpVideo } from './LpVideo'
import { LpSocialProof } from './LpSocialProof'
import { LpProblem } from './LpProblem'
import { LpFeatures } from './LpFeatures'
import { LpTestimonials } from './LpTestimonials'
import { LpFaq } from './LpFaq'
import { LpEmailCapture } from './LpEmailCapture'
import { LpCta } from './LpCta'
import { LpCoachBio } from './LpCoachBio'
import { LpOriginStory } from './LpOriginStory'
import { LpCurriculum } from './LpCurriculum'
import { LpBonusDeliverables } from './LpBonusDeliverables'
import { LpFitCheck } from './LpFitCheck'
import { LpPricingCard } from './LpPricingCard'
import { LpRiskReversal } from './LpRiskReversal'
import { LpTweetWall } from './LpTweetWall'
import { LpFrameworkSteps } from './LpFrameworkSteps'
import { LpLeadMagnet } from './LpLeadMagnet'
import { LpGeneric } from './LpGeneric'

export interface SimpleSection {
  id: string
  type: string
  isVisible: boolean
  content: Record<string, unknown>
}

export function LpRender({
  sections,
  accent = '#F05A1A',
  emailList = 'general',
}: {
  sections: SimpleSection[]
  accent?: string
  emailList?: string
}) {
  return (
    <>
      {sections
        .filter((s) => s.isVisible)
        .map((s) => {
          const content = s.content as Record<string, any>
          switch (s.type) {
            case 'hero':
              return <LpHero key={s.id} content={content} accent={accent} emailList={emailList} />
            case 'video':
              return <LpVideo key={s.id} content={content} />
            case 'social_proof':
              return <LpSocialProof key={s.id} content={content} />
            case 'problem':
              return <LpProblem key={s.id} content={content} />
            case 'origin_story':
              return <LpOriginStory key={s.id} content={content} accent={accent} />
            case 'solution':
            case 'features':
            case 'how_it_works':
            case 'offer':
              return <LpFeatures key={s.id} content={content} accent={accent} type={s.type} />
            case 'curriculum':
              return <LpCurriculum key={s.id} content={content} accent={accent} />
            case 'bonus_deliverables':
              return <LpBonusDeliverables key={s.id} content={content} accent={accent} />
            case 'fit_check':
              return <LpFitCheck key={s.id} content={content} accent={accent} />
            case 'testimonials':
              return <LpTestimonials key={s.id} content={content} />
            case 'tweet_wall':
              return <LpTweetWall key={s.id} content={content} accent={accent} />
            case 'framework_steps':
              return <LpFrameworkSteps key={s.id} content={content} accent={accent} />
            case 'lead_magnet':
              return <LpLeadMagnet key={s.id} content={content} accent={accent} emailList={emailList} />
            case 'pricing_card':
              return <LpPricingCard key={s.id} content={content} accent={accent} />
            case 'risk_reversal':
              return <LpRiskReversal key={s.id} content={content} accent={accent} />
            case 'faq':
              return <LpFaq key={s.id} content={content} />
            case 'email_capture':
              return <LpEmailCapture key={s.id} content={content} accent={accent} emailList={emailList} />
            case 'cta':
              return <LpCta key={s.id} content={content} accent={accent} />
            case 'coach_bio':
              return <LpCoachBio key={s.id} content={content} />
            case 'spacer':
              return <div key={s.id} style={{ height: 64 }} />
            default:
              return <LpGeneric key={s.id} content={content} />
          }
        })}
    </>
  )
}
