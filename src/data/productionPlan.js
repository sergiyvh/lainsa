export const PRODUCTION_PLAN = {
procesado_ropa:
[ // UD/HORA, UD/TURNO — орі
нтири { name: 'Toallas', unitHour: 320, unitShif
: 2400 }, { name: 'Sábanas', unitHour: 150, unit
hift: 1125 }, { name: 'Servilletas', unitHour: 550,
nitShift: 4125 }, { name: 'Fundas de almohada', unitHour:
20
unitShif
: 1650 } ], lavado: [ { name: 'Rendimiento tún
l de lavado', value: '80%' }, { name: 'Rendimiento plan
a'
value: '5
kg/persona/hora' } ], calidad: [ {
name: 'Rechazo externo', value: '< 1%' },
{ name: 'Rechazo interno', value: '< 8%' }, { name: 'Calidad
on
aje de
arros', value: '< 3 quejas clientes' } ], rrhh
[ { name: 'Accidentalidad', value: '0
accidentes' }, { name: 'Presencialidad', v
l
export function evaluateBonus(todayTotalsKg, planKgPerShift = 50 /* загальний KPI, адаптуємо */) {
// Проста перевірка: якщо загальний кг/зміну на оператора >= план — “cumple
. // За потреби підженемо формулу під ваші прав
ла. return todayTotalsKg >= planKgPer