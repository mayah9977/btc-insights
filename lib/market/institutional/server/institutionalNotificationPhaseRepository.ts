// lib/market/institutional/server/institutionalNotificationPhaseRepository.ts

import { randomUUID } from 'crypto'

import { redis } from '@/lib/redis'

import type {
  InstitutionalPatternDirection1h,
} from '@/lib/market/institutional/buildInstitutionalConfirmation1h'

import type {
  InstitutionalPatternIntensity,
  InstitutionalPatternRisk,
  InstitutionalPatternType,
} from '@/lib/market/patterns/detectInstitutionalPattern'

export type ReserveReadyResult =
  | {
      status: 'RESERVED'
      token: string
    }
  | {
      status: 'SUPPRESSED_PHASE_REPEAT'
    }
  | {
      status: 'RESERVATION_BUSY'
    }
  | {
      status: 'STALE'
    }

export type CommitReadyResult =
  | {
      status: 'COMMITTED'
    }
  | {
      status: 'ALREADY_COMMITTED'
    }
  | {
      status: 'LOST_RESERVATION'
    }
  | {
      status: 'STALE'
    }

export type RenewReservationResult =
  | {
      status: 'RENEWED'
    }
  | {
      status: 'ALREADY_COMMITTED'
    }
  | {
      status: 'LOST_RESERVATION'
    }
  | {
      status: 'STALE'
    }

export type AbortReadyResult =
  | {
      status: 'ABORTED'
    }
  | {
      status: 'ALREADY_COMMITTED'
    }
  | {
      status: 'LOST_RESERVATION'
    }
  | {
      status: 'STALE'
    }

export type ApplyNonReadyResult =
  | {
      status: 'RESET'
    }
  | {
      status: 'STALE'
    }

type ReadyPatternType =
  Exclude<
    InstitutionalPatternType,
    'NONE'
  >

const RESERVATION_TTL_MS =
  120_000

const REPEAT_COOLDOWN_MS =
  2 * 60 * 60 * 1000

const EVALUATION_INTERVAL_MS =
  30 * 60 * 1000

const RISK_RANK: Record<
  InstitutionalPatternRisk,
  number
> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
}

const INTENSITY_RANK: Record<
  InstitutionalPatternIntensity,
  number
> = {
  WEAK: 1,
  BUILDING: 2,
  AGGRESSIVE: 3,
  EXTREME: 4,
}

const PATTERN_DIRECTIONS:
  readonly InstitutionalPatternDirection1h[] = [
    'LONG',
    'SHORT',
    'NON_DIRECTIONAL',
  ]

const PATTERN_RISKS:
  readonly InstitutionalPatternRisk[] = [
    'LOW',
    'MEDIUM',
    'HIGH',
  ]

const PATTERN_INTENSITIES:
  readonly InstitutionalPatternIntensity[] = [
    'WEAK',
    'BUILDING',
    'AGGRESSIVE',
    'EXTREME',
  ]

function getPhaseKey(
  symbol: string,
) {
  return (
    'institutional-pattern:notification-phase:' +
    symbol
  )
}

function getReservationKey(
  symbol: string,
) {
  return (
    'institutional-pattern:notification-reservation:' +
    symbol
  )
}

function assertSymbol(
  symbol: string,
) {
  if (symbol.trim().length === 0) {
    throw new Error(
      'Institutional notification phase symbol is required',
    )
  }
}

function assertEventId(
  eventId: string,
) {
  if (eventId.length === 0) {
    throw new Error(
      'Institutional notification phase eventId is required',
    )
  }
}

function assertConfirmedCandleTs(
  confirmedCandleTs: number,
) {
  if (!Number.isFinite(confirmedCandleTs)) {
    throw new Error(
      'Invalid institutional notification phase confirmedCandleTs',
    )
  }
}

function isReadyPatternType(
  value: InstitutionalPatternType,
): value is ReadyPatternType {
  return value !== 'NONE'
}

function assertReadyPatternType(
  pattern: InstitutionalPatternType,
): asserts pattern is ReadyPatternType {
  if (!isReadyPatternType(pattern)) {
    throw new Error(
      'Invalid institutional notification phase READY pattern',
    )
  }
}

function assertDirection(
  direction: InstitutionalPatternDirection1h,
) {
  if (!PATTERN_DIRECTIONS.includes(direction)) {
    throw new Error(
      'Invalid institutional notification phase direction',
    )
  }
}

function assertRisk(
  risk: InstitutionalPatternRisk,
) {
  if (!PATTERN_RISKS.includes(risk)) {
    throw new Error(
      'Invalid institutional notification phase risk',
    )
  }
}

function assertIntensity(
  intensity: InstitutionalPatternIntensity,
) {
  if (!PATTERN_INTENSITIES.includes(intensity)) {
    throw new Error(
      'Invalid institutional notification phase intensity',
    )
  }
}

function assertToken(
  token: string,
) {
  if (token.length === 0) {
    throw new Error(
      'Institutional notification phase token is required',
    )
  }
}

const RESERVE_READY_SCRIPT = `
local function decode_json_or_error(raw, label)
  if not raw then
    return nil
  end

  local ok, value = pcall(cjson.decode, raw)

  if not ok or type(value) ~= 'table' then
    error(
      'INVALID_' .. label
    )
  end

  return value
end

local phase = decode_json_or_error(
  redis.call('GET', KEYS[1]),
  'PHASE_STATE'
)

local reservation = decode_json_or_error(
  redis.call('GET', KEYS[2]),
  'PHASE_RESERVATION'
)

local eventId = ARGV[1]
local token = ARGV[2]
local confirmedCandleTs = tonumber(ARGV[3])
local now = tonumber(ARGV[4])
local reservationTtlMs = tonumber(ARGV[5])
local cooldownMs = tonumber(ARGV[6])
local pattern = ARGV[7]
local direction = ARGV[8]
local risk = ARGV[9]
local riskRank = tonumber(ARGV[10])
local intensity = ARGV[11]
local intensityRank = tonumber(ARGV[12])
local evaluationIntervalMs = tonumber(ARGV[13])

if not confirmedCandleTs or
   not now or
   not reservationTtlMs or
   not cooldownMs or
   not riskRank or
   not intensityRank or
   not evaluationIntervalMs then
  return redis.error_reply(
    'INVALID_RESERVE_READY_ARGUMENT'
  )
end

if phase then
  if phase.version ~= 1 or
     type(phase.lastEvaluationConfirmedCandleTs) ~= 'number' or
     (phase.phaseStatus ~= 'READY' and
      phase.phaseStatus ~= 'NON_READY') then
    return redis.error_reply(
      'INVALID_PHASE_STATE'
    )
  end

  if phase.phaseStatus == 'READY' then
    if type(phase.pattern) ~= 'string' or
       type(phase.direction) ~= 'string' or
       type(phase.highWaterRisk) ~= 'string' or
       type(phase.highWaterRiskRank) ~= 'number' or
       type(phase.highWaterIntensity) ~= 'string' or
       type(phase.highWaterIntensityRank) ~= 'number' or
       type(phase.lastAlertEventId) ~= 'string' or
       type(phase.lastAlertToken) ~= 'string' or
       type(phase.lastAlertConfirmedCandleTs) ~= 'number' or
       type(phase.lastAlertedAt) ~= 'number' then
      return redis.error_reply(
        'INVALID_READY_PHASE_STATE'
      )
    end
  end

  if phase.lastEvaluationConfirmedCandleTs > confirmedCandleTs then
    return 'STALE'
  end
end

if reservation then
  if reservation.version ~= 1 or
     type(reservation.eventId) ~= 'string' or
     type(reservation.token) ~= 'string' or
     type(reservation.confirmedCandleTs) ~= 'number' or
     type(reservation.reservedAt) ~= 'number' or
     type(reservation.expiresAt) ~= 'number' or
     type(reservation.reason) ~= 'string' or
     type(reservation.candidatePattern) ~= 'string' or
     type(reservation.candidateDirection) ~= 'string' or
     type(reservation.candidateRisk) ~= 'string' or
     type(reservation.candidateRiskRank) ~= 'number' or
     type(reservation.candidateIntensity) ~= 'string' or
     type(reservation.candidateIntensityRank) ~= 'number' then
    return redis.error_reply(
      'INVALID_PHASE_RESERVATION'
    )
  end

  return 'RESERVATION_BUSY'
end

local reason = nil

if not phase or phase.phaseStatus == 'NON_READY' then
  reason = 'NEW_PHASE'
elseif confirmedCandleTs -
       phase.lastEvaluationConfirmedCandleTs >
       evaluationIntervalMs then
  reason = 'NEW_PHASE'
elseif phase.pattern ~= pattern then
  reason = 'PATTERN_CHANGE'
elseif phase.direction ~= direction then
  reason = 'DIRECTION_CHANGE'
else
  if riskRank > phase.highWaterRiskRank then
    reason = 'RISK_ESCALATION'
  elseif intensityRank > phase.highWaterIntensityRank then
    reason = 'INTENSITY_ESCALATION'
  elseif now - phase.lastAlertedAt >= cooldownMs then
    reason = 'COOLDOWN_REMINDER'
  else
    if confirmedCandleTs > phase.lastEvaluationConfirmedCandleTs then
      phase.lastEvaluationConfirmedCandleTs = confirmedCandleTs

      redis.call(
        'SET',
        KEYS[1],
        cjson.encode(phase)
      )
    end

    return 'SUPPRESSED_PHASE_REPEAT'
  end
end

local reservationValue = {
  version = 1,
  eventId = eventId,
  token = token,
  confirmedCandleTs = confirmedCandleTs,
  reservedAt = now,
  expiresAt = now + reservationTtlMs,
  reason = reason,
  candidatePattern = pattern,
  candidateDirection = direction,
  candidateRisk = risk,
  candidateRiskRank = riskRank,
  candidateIntensity = intensity,
  candidateIntensityRank = intensityRank
}

redis.call(
  'SET',
  KEYS[2],
  cjson.encode(reservationValue),
  'PX',
  reservationTtlMs
)

return 'RESERVED'
`

const COMMIT_READY_SCRIPT = `
local function decode_json_or_error(raw, label)
  if not raw then
    return nil
  end

  local ok, value = pcall(cjson.decode, raw)

  if not ok or type(value) ~= 'table' then
    error(
      'INVALID_' .. label
    )
  end

  return value
end

local phase = decode_json_or_error(
  redis.call('GET', KEYS[1]),
  'PHASE_STATE'
)

local reservation = decode_json_or_error(
  redis.call('GET', KEYS[2]),
  'PHASE_RESERVATION'
)

local eventId = ARGV[1]
local token = ARGV[2]
local confirmedCandleTs = tonumber(ARGV[3])
local now = tonumber(ARGV[4])
local pattern = ARGV[5]
local direction = ARGV[6]
local risk = ARGV[7]
local riskRank = tonumber(ARGV[8])
local intensity = ARGV[9]
local intensityRank = tonumber(ARGV[10])

if not confirmedCandleTs or
   not now or
   not riskRank or
   not intensityRank then
  return redis.error_reply(
    'INVALID_COMMIT_READY_ARGUMENT'
  )
end

if phase then
  if phase.version ~= 1 or
     type(phase.lastEvaluationConfirmedCandleTs) ~= 'number' or
     (phase.phaseStatus ~= 'READY' and
      phase.phaseStatus ~= 'NON_READY') then
    return redis.error_reply(
      'INVALID_PHASE_STATE'
    )
  end

  if phase.phaseStatus == 'READY' then
    if type(phase.pattern) ~= 'string' or
       type(phase.direction) ~= 'string' or
       type(phase.highWaterRisk) ~= 'string' or
       type(phase.highWaterRiskRank) ~= 'number' or
       type(phase.highWaterIntensity) ~= 'string' or
       type(phase.highWaterIntensityRank) ~= 'number' or
       type(phase.lastAlertEventId) ~= 'string' or
       type(phase.lastAlertToken) ~= 'string' or
       type(phase.lastAlertConfirmedCandleTs) ~= 'number' or
       type(phase.lastAlertedAt) ~= 'number' then
      return redis.error_reply(
        'INVALID_READY_PHASE_STATE'
      )
    end

    if phase.lastAlertEventId == eventId and
       phase.lastAlertToken == token then
      return 'ALREADY_COMMITTED'
    end

    if phase.lastAlertEventId == eventId then
      return 'ALREADY_COMMITTED'
    end
  end

  if phase.lastEvaluationConfirmedCandleTs > confirmedCandleTs then
    return 'STALE'
  end
end

if not reservation then
  return 'LOST_RESERVATION'
end

if reservation.version ~= 1 or
   type(reservation.eventId) ~= 'string' or
   type(reservation.token) ~= 'string' or
   type(reservation.confirmedCandleTs) ~= 'number' or
   type(reservation.reservedAt) ~= 'number' or
   type(reservation.expiresAt) ~= 'number' or
   type(reservation.reason) ~= 'string' or
   type(reservation.candidatePattern) ~= 'string' or
   type(reservation.candidateDirection) ~= 'string' or
   type(reservation.candidateRisk) ~= 'string' or
   type(reservation.candidateRiskRank) ~= 'number' or
   type(reservation.candidateIntensity) ~= 'string' or
   type(reservation.candidateIntensityRank) ~= 'number' then
  return redis.error_reply(
    'INVALID_PHASE_RESERVATION'
  )
end

if reservation.eventId ~= eventId or
   reservation.token ~= token or
   reservation.confirmedCandleTs ~= confirmedCandleTs then
  return 'LOST_RESERVATION'
end

if reservation.candidatePattern ~= pattern or
   reservation.candidateDirection ~= direction or
   reservation.candidateRisk ~= risk or
   reservation.candidateRiskRank ~= riskRank or
   reservation.candidateIntensity ~= intensity or
   reservation.candidateIntensityRank ~= intensityRank then
  return redis.error_reply(
    'PHASE_RESERVATION_COMMIT_MISMATCH'
  )
end

local resetHighWater = false

if not phase or
   phase.phaseStatus == 'NON_READY' or
   reservation.reason == 'NEW_PHASE' or
   reservation.reason == 'PATTERN_CHANGE' then
  resetHighWater = true
end

local highWaterRisk = risk
local highWaterRiskRank = riskRank
local highWaterIntensity = intensity
local highWaterIntensityRank = intensityRank

if not resetHighWater then
  highWaterRisk = phase.highWaterRisk
  highWaterRiskRank = phase.highWaterRiskRank
  highWaterIntensity = phase.highWaterIntensity
  highWaterIntensityRank = phase.highWaterIntensityRank

  if riskRank > highWaterRiskRank then
    highWaterRisk = risk
    highWaterRiskRank = riskRank
  end

  if intensityRank > highWaterIntensityRank then
    highWaterIntensity = intensity
    highWaterIntensityRank = intensityRank
  end
end

local nextState = {
  version = 1,
  lastEvaluationConfirmedCandleTs = confirmedCandleTs,
  phaseStatus = 'READY',
  pattern = pattern,
  direction = direction,
  highWaterRisk = highWaterRisk,
  highWaterRiskRank = highWaterRiskRank,
  highWaterIntensity = highWaterIntensity,
  highWaterIntensityRank = highWaterIntensityRank,
  lastAlertEventId = eventId,
  lastAlertToken = token,
  lastAlertConfirmedCandleTs = confirmedCandleTs,
  lastAlertedAt = now
}

redis.call(
  'SET',
  KEYS[1],
  cjson.encode(nextState)
)

redis.call(
  'DEL',
  KEYS[2]
)

return 'COMMITTED'
`

const RENEW_RESERVATION_SCRIPT = `
local function decode_json_or_error(raw, label)
  if not raw then
    return nil
  end

  local ok, value = pcall(cjson.decode, raw)

  if not ok or type(value) ~= 'table' then
    error(
      'INVALID_' .. label
    )
  end

  return value
end

local phase = decode_json_or_error(
  redis.call('GET', KEYS[1]),
  'PHASE_STATE'
)

local reservation = decode_json_or_error(
  redis.call('GET', KEYS[2]),
  'PHASE_RESERVATION'
)

local eventId = ARGV[1]
local token = ARGV[2]
local confirmedCandleTs = tonumber(ARGV[3])
local now = tonumber(ARGV[4])
local reservationTtlMs = tonumber(ARGV[5])

if not confirmedCandleTs or
   not now or
   not reservationTtlMs then
  return redis.error_reply(
    'INVALID_RENEW_RESERVATION_ARGUMENT'
  )
end

if phase then
  if phase.version ~= 1 or
     type(phase.lastEvaluationConfirmedCandleTs) ~= 'number' or
     (phase.phaseStatus ~= 'READY' and
      phase.phaseStatus ~= 'NON_READY') then
    return redis.error_reply(
      'INVALID_PHASE_STATE'
    )
  end

  if phase.phaseStatus == 'READY' then
    if type(phase.lastAlertEventId) ~= 'string' or
       type(phase.lastAlertToken) ~= 'string' then
      return redis.error_reply(
        'INVALID_READY_PHASE_STATE'
      )
    end

    if phase.lastAlertEventId == eventId and
       phase.lastAlertToken == token then
      return 'ALREADY_COMMITTED'
    end

    if phase.lastAlertEventId == eventId then
      return 'ALREADY_COMMITTED'
    end
  end

  if phase.lastEvaluationConfirmedCandleTs > confirmedCandleTs then
    return 'STALE'
  end
end

if not reservation then
  return 'LOST_RESERVATION'
end

if reservation.version ~= 1 or
   type(reservation.eventId) ~= 'string' or
   type(reservation.token) ~= 'string' or
   type(reservation.confirmedCandleTs) ~= 'number' or
   type(reservation.reservedAt) ~= 'number' or
   type(reservation.expiresAt) ~= 'number' or
   type(reservation.reason) ~= 'string' or
   type(reservation.candidatePattern) ~= 'string' or
   type(reservation.candidateDirection) ~= 'string' or
   type(reservation.candidateRisk) ~= 'string' or
   type(reservation.candidateRiskRank) ~= 'number' or
   type(reservation.candidateIntensity) ~= 'string' or
   type(reservation.candidateIntensityRank) ~= 'number' then
  return redis.error_reply(
    'INVALID_PHASE_RESERVATION'
  )
end

if reservation.eventId ~= eventId or
   reservation.token ~= token or
   reservation.confirmedCandleTs ~= confirmedCandleTs then
  return 'LOST_RESERVATION'
end

reservation.expiresAt =
  now + reservationTtlMs

redis.call(
  'SET',
  KEYS[2],
  cjson.encode(reservation),
  'PX',
  reservationTtlMs
)

return 'RENEWED'
`

const ABORT_READY_SCRIPT = `
local function decode_json_or_error(raw, label)
  if not raw then
    return nil
  end

  local ok, value = pcall(cjson.decode, raw)

  if not ok or type(value) ~= 'table' then
    error(
      'INVALID_' .. label
    )
  end

  return value
end

local phase = decode_json_or_error(
  redis.call('GET', KEYS[1]),
  'PHASE_STATE'
)

local reservation = decode_json_or_error(
  redis.call('GET', KEYS[2]),
  'PHASE_RESERVATION'
)

local eventId = ARGV[1]
local token = ARGV[2]
local confirmedCandleTs = tonumber(ARGV[3])

if not confirmedCandleTs then
  return redis.error_reply(
    'INVALID_ABORT_READY_ARGUMENT'
  )
end

if phase then
  if phase.version ~= 1 or
     type(phase.lastEvaluationConfirmedCandleTs) ~= 'number' or
     (phase.phaseStatus ~= 'READY' and
      phase.phaseStatus ~= 'NON_READY') then
    return redis.error_reply(
      'INVALID_PHASE_STATE'
    )
  end

  if phase.phaseStatus == 'READY' then
    if type(phase.lastAlertEventId) ~= 'string' or
       type(phase.lastAlertToken) ~= 'string' then
      return redis.error_reply(
        'INVALID_READY_PHASE_STATE'
      )
    end

    if phase.lastAlertEventId == eventId and
       phase.lastAlertToken == token then
      return 'ALREADY_COMMITTED'
    end

    if phase.lastAlertEventId == eventId then
      return 'ALREADY_COMMITTED'
    end
  end

  if phase.lastEvaluationConfirmedCandleTs > confirmedCandleTs then
    return 'STALE'
  end
end

if not reservation then
  return 'LOST_RESERVATION'
end

if reservation.version ~= 1 or
   type(reservation.eventId) ~= 'string' or
   type(reservation.token) ~= 'string' or
   type(reservation.confirmedCandleTs) ~= 'number' or
   type(reservation.reservedAt) ~= 'number' or
   type(reservation.expiresAt) ~= 'number' or
   type(reservation.reason) ~= 'string' or
   type(reservation.candidatePattern) ~= 'string' or
   type(reservation.candidateDirection) ~= 'string' or
   type(reservation.candidateRisk) ~= 'string' or
   type(reservation.candidateRiskRank) ~= 'number' or
   type(reservation.candidateIntensity) ~= 'string' or
   type(reservation.candidateIntensityRank) ~= 'number' then
  return redis.error_reply(
    'INVALID_PHASE_RESERVATION'
  )
end

if reservation.eventId ~= eventId or
   reservation.token ~= token or
   reservation.confirmedCandleTs ~= confirmedCandleTs then
  return 'LOST_RESERVATION'
end

redis.call(
  'DEL',
  KEYS[2]
)

return 'ABORTED'
`

const APPLY_NON_READY_SCRIPT = `
local function decode_json_or_error(raw, label)
  if not raw then
    return nil
  end

  local ok, value = pcall(cjson.decode, raw)

  if not ok or type(value) ~= 'table' then
    error(
      'INVALID_' .. label
    )
  end

  return value
end

local phase = decode_json_or_error(
  redis.call('GET', KEYS[1]),
  'PHASE_STATE'
)

local reservation = decode_json_or_error(
  redis.call('GET', KEYS[2]),
  'PHASE_RESERVATION'
)

local confirmedCandleTs = tonumber(ARGV[1])

if not confirmedCandleTs then
  return redis.error_reply(
    'INVALID_NON_READY_ARGUMENT'
  )
end

if phase then
  if phase.version ~= 1 or
     type(phase.lastEvaluationConfirmedCandleTs) ~= 'number' or
     (phase.phaseStatus ~= 'READY' and
      phase.phaseStatus ~= 'NON_READY') then
    return redis.error_reply(
      'INVALID_PHASE_STATE'
    )
  end

  if phase.phaseStatus == 'READY' then
    if type(phase.pattern) ~= 'string' or
       type(phase.direction) ~= 'string' or
       type(phase.highWaterRisk) ~= 'string' or
       type(phase.highWaterRiskRank) ~= 'number' or
       type(phase.highWaterIntensity) ~= 'string' or
       type(phase.highWaterIntensityRank) ~= 'number' or
       type(phase.lastAlertEventId) ~= 'string' or
       type(phase.lastAlertToken) ~= 'string' or
       type(phase.lastAlertConfirmedCandleTs) ~= 'number' or
       type(phase.lastAlertedAt) ~= 'number' then
      return redis.error_reply(
        'INVALID_READY_PHASE_STATE'
      )
    end
  end

  if confirmedCandleTs <= phase.lastEvaluationConfirmedCandleTs then
    return 'STALE'
  end
end

if reservation then
  if reservation.version ~= 1 or
     type(reservation.eventId) ~= 'string' or
     type(reservation.token) ~= 'string' or
     type(reservation.confirmedCandleTs) ~= 'number' or
     type(reservation.reservedAt) ~= 'number' or
     type(reservation.expiresAt) ~= 'number' or
     type(reservation.reason) ~= 'string' or
     type(reservation.candidatePattern) ~= 'string' or
     type(reservation.candidateDirection) ~= 'string' or
     type(reservation.candidateRisk) ~= 'string' or
     type(reservation.candidateRiskRank) ~= 'number' or
     type(reservation.candidateIntensity) ~= 'string' or
     type(reservation.candidateIntensityRank) ~= 'number' then
    return redis.error_reply(
      'INVALID_PHASE_RESERVATION'
    )
  end

  if reservation.confirmedCandleTs < confirmedCandleTs then
    redis.call(
      'DEL',
      KEYS[2]
    )
  end
end

local nextState = {
  version = 1,
  lastEvaluationConfirmedCandleTs = confirmedCandleTs,
  phaseStatus = 'NON_READY',
  pattern = cjson.null,
  direction = cjson.null,
  highWaterRisk = cjson.null,
  highWaterRiskRank = cjson.null,
  highWaterIntensity = cjson.null,
  highWaterIntensityRank = cjson.null,
  lastAlertEventId = cjson.null,
  lastAlertToken = cjson.null,
  lastAlertConfirmedCandleTs = cjson.null,
  lastAlertedAt = cjson.null
}

redis.call(
  'SET',
  KEYS[1],
  cjson.encode(nextState)
)

return 'RESET'
`

function isReserveReadyStatus(
  value: unknown,
): value is
  | 'RESERVED'
  | 'SUPPRESSED_PHASE_REPEAT'
  | 'RESERVATION_BUSY'
  | 'STALE' {
  return (
    value === 'RESERVED' ||
    value === 'SUPPRESSED_PHASE_REPEAT' ||
    value === 'RESERVATION_BUSY' ||
    value === 'STALE'
  )
}

function isCommitReadyStatus(
  value: unknown,
): value is
  | 'COMMITTED'
  | 'ALREADY_COMMITTED'
  | 'LOST_RESERVATION'
  | 'STALE' {
  return (
    value === 'COMMITTED' ||
    value === 'ALREADY_COMMITTED' ||
    value === 'LOST_RESERVATION' ||
    value === 'STALE'
  )
}

function isRenewReservationStatus(
  value: unknown,
): value is
  | 'RENEWED'
  | 'ALREADY_COMMITTED'
  | 'LOST_RESERVATION'
  | 'STALE' {
  return (
    value === 'RENEWED' ||
    value === 'ALREADY_COMMITTED' ||
    value === 'LOST_RESERVATION' ||
    value === 'STALE'
  )
}

function isAbortReadyStatus(
  value: unknown,
): value is
  | 'ABORTED'
  | 'ALREADY_COMMITTED'
  | 'LOST_RESERVATION'
  | 'STALE' {
  return (
    value === 'ABORTED' ||
    value === 'ALREADY_COMMITTED' ||
    value === 'LOST_RESERVATION' ||
    value === 'STALE'
  )
}

function isApplyNonReadyStatus(
  value: unknown,
): value is
  | 'RESET'
  | 'STALE' {
  return (
    value === 'RESET' ||
    value === 'STALE'
  )
}

export async function reserveInstitutionalNotificationReady(params: {
  symbol: string
  eventId: string
  confirmedCandleTs: number
  pattern: InstitutionalPatternType
  direction: InstitutionalPatternDirection1h
  risk: InstitutionalPatternRisk
  intensity: InstitutionalPatternIntensity
}): Promise<ReserveReadyResult> {
  const {
    symbol,
    eventId,
    confirmedCandleTs,
    pattern,
    direction,
    risk,
    intensity,
  } = params

  assertSymbol(symbol)
  assertEventId(eventId)
  assertConfirmedCandleTs(
    confirmedCandleTs,
  )
  assertReadyPatternType(pattern)
  assertDirection(direction)
  assertRisk(risk)
  assertIntensity(intensity)

  const token =
    randomUUID()

  const result = await redis.eval(
    RESERVE_READY_SCRIPT,
    2,
    getPhaseKey(symbol),
    getReservationKey(symbol),
    eventId,
    token,
    confirmedCandleTs,
    Date.now(),
    RESERVATION_TTL_MS,
    REPEAT_COOLDOWN_MS,
    pattern,
    direction,
    risk,
    RISK_RANK[risk],
    intensity,
    INTENSITY_RANK[intensity],
    EVALUATION_INTERVAL_MS,
  )

  if (!isReserveReadyStatus(result)) {
    throw new Error(
      'Unexpected institutional notification reserve result',
    )
  }

  if (result === 'RESERVED') {
    return {
      status: 'RESERVED',
      token,
    }
  }

  return {
    status: result,
  }
}

export async function commitInstitutionalNotificationReady(params: {
  symbol: string
  eventId: string
  token: string
  confirmedCandleTs: number
  pattern: InstitutionalPatternType
  direction: InstitutionalPatternDirection1h
  risk: InstitutionalPatternRisk
  intensity: InstitutionalPatternIntensity
}): Promise<CommitReadyResult> {
  const {
    symbol,
    eventId,
    token,
    confirmedCandleTs,
    pattern,
    direction,
    risk,
    intensity,
  } = params

  assertSymbol(symbol)
  assertEventId(eventId)
  assertToken(token)
  assertConfirmedCandleTs(
    confirmedCandleTs,
  )
  assertReadyPatternType(pattern)
  assertDirection(direction)
  assertRisk(risk)
  assertIntensity(intensity)

  const result = await redis.eval(
    COMMIT_READY_SCRIPT,
    2,
    getPhaseKey(symbol),
    getReservationKey(symbol),
    eventId,
    token,
    confirmedCandleTs,
    Date.now(),
    pattern,
    direction,
    risk,
    RISK_RANK[risk],
    intensity,
    INTENSITY_RANK[intensity],
  )

  if (!isCommitReadyStatus(result)) {
    throw new Error(
      'Unexpected institutional notification commit result',
    )
  }

  return {
    status: result,
  }
}

export async function renewInstitutionalNotificationReservation(params: {
  symbol: string
  eventId: string
  token: string
  confirmedCandleTs: number
}): Promise<RenewReservationResult> {
  const {
    symbol,
    eventId,
    token,
    confirmedCandleTs,
  } = params

  assertSymbol(symbol)
  assertEventId(eventId)
  assertToken(token)
  assertConfirmedCandleTs(
    confirmedCandleTs,
  )

  const result = await redis.eval(
    RENEW_RESERVATION_SCRIPT,
    2,
    getPhaseKey(symbol),
    getReservationKey(symbol),
    eventId,
    token,
    confirmedCandleTs,
    Date.now(),
    RESERVATION_TTL_MS,
  )

  if (!isRenewReservationStatus(result)) {
    throw new Error(
      'Unexpected institutional notification reservation renew result',
    )
  }

  return {
    status: result,
  }
}

export async function abortInstitutionalNotificationReady(params: {
  symbol: string
  eventId: string
  token: string
  confirmedCandleTs: number
}): Promise<AbortReadyResult> {
  const {
    symbol,
    eventId,
    token,
    confirmedCandleTs,
  } = params

  assertSymbol(symbol)
  assertEventId(eventId)
  assertToken(token)
  assertConfirmedCandleTs(
    confirmedCandleTs,
  )

  const result = await redis.eval(
    ABORT_READY_SCRIPT,
    2,
    getPhaseKey(symbol),
    getReservationKey(symbol),
    eventId,
    token,
    confirmedCandleTs,
  )

  if (!isAbortReadyStatus(result)) {
    throw new Error(
      'Unexpected institutional notification abort result',
    )
  }

  return {
    status: result,
  }
}

export async function applyInstitutionalNotificationNonReady(params: {
  symbol: string
  confirmedCandleTs: number
}): Promise<ApplyNonReadyResult> {
  const {
    symbol,
    confirmedCandleTs,
  } = params

  assertSymbol(symbol)
  assertConfirmedCandleTs(
    confirmedCandleTs,
  )

  const result = await redis.eval(
    APPLY_NON_READY_SCRIPT,
    2,
    getPhaseKey(symbol),
    getReservationKey(symbol),
    confirmedCandleTs,
  )

  if (!isApplyNonReadyStatus(result)) {
    throw new Error(
      'Unexpected institutional notification non-ready result',
    )
  }

  return {
    status: result,
  }
}
