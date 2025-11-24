export default function predictWaitTime(appointments) {
  const completed = appointments.filter(
    (a) => a.status === "completed" && a.checkInTime && a.completedTime
  );
  if (completed.length === 0) return 10; // Default wait time

  const avgDuration =
    completed.reduce((sum, a) => {
      const duration =
        (new Date(a.completedTime) - new Date(a.checkInTime)) / 60000;
      return sum + duration;
    }, 0) / completed.length;

  const waitingCount = appointments.filter(
    (a) => a.status === "waiting"
  ).length;

  return Math.round(avgDuration * waitingCount);
}
