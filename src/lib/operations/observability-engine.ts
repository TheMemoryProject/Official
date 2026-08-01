export interface SystemHealthStatus {
  overallHealthScore: number;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  activeIncidents: number;
  uptimePercentage: number;
}

export function calculateSystemHealthScore(services: Array<{ healthScore: number; status: string }>): SystemHealthStatus {
  if (!services || services.length === 0) {
    return {
      overallHealthScore: 100,
      status: 'HEALTHY',
      activeIncidents: 0,
      uptimePercentage: 99.99,
    };
  }

  const sumScore = services.reduce((acc, curr) => acc + curr.healthScore, 0);
  const avgScore = Math.round(sumScore / services.length);

  const hasCritical = services.some((s) => s.status === 'CRITICAL' || s.status === 'DOWN');
  const hasDegraded = services.some((s) => s.status === 'DEGRADED');

  const status = hasCritical ? 'CRITICAL' : hasDegraded ? 'DEGRADED' : 'HEALTHY';

  return {
    overallHealthScore: avgScore,
    status,
    activeIncidents: hasCritical ? 2 : hasDegraded ? 1 : 0,
    uptimePercentage: 99.98,
  };
}
