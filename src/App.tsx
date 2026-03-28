// ═══════════════════════════════════════════════════════════════
// P·A·R·I·T·Y  —  App Root
// Screen orchestrator — thin wrapper, all logic lives in screens
// ═══════════════════════════════════════════════════════════════

import { AnimatePresence, motion } from 'framer-motion'
import { useDebateStore } from './store/debateStore'
import TopicInput from './components/screens/TopicInput'
import SteelmanView from './components/screens/SteelmanView'
import SideSelect from './components/screens/SideSelect'
import DebateArena from './components/screens/DebateArena'
import VerdictScreen from './components/screens/VerdictScreen'
import Leaderboard from './components/screens/Leaderboard'
import DotGrid from './components/ui/DotGrid'

// Screen transition variants
const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    x: dir < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.98,
  }),
}

const SCREEN_INDEX: Record<string, number> = {
  topic: 0,
  steelman: 1,
  sideselect: 2,
  debate: 3,
  verdict: 4,
  leaderboard: 5,
}

let prevScreenIdx = 0

export default function App() {
  const screen = useDebateStore((s) => s.screen)
  const currentIdx = SCREEN_INDEX[screen] ?? 0
  const dir = currentIdx - prevScreenIdx
  prevScreenIdx = currentIdx

  return (
    <div
      className="dot-grid-bg full-screen"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Animated dot grid canvas */}
      <DotGrid />

      {/* Screen renderer */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={screen}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: 0.38,
            ease: [0.4, 0, 0.2, 1],
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {screen === 'topic'       && <TopicInput />}
          {screen === 'steelman'    && <SteelmanView />}
          {screen === 'sideselect'  && <SideSelect />}
          {screen === 'debate'      && <DebateArena />}
          {screen === 'verdict'     && <VerdictScreen />}
          {screen === 'leaderboard' && <Leaderboard />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
