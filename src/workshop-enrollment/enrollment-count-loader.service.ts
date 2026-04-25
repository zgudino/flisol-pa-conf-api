import { Injectable, Scope } from '@nestjs/common';
// import DataLoader from 'dataloader'; // TODO Bloque 3 — Descomenta esta importación
import { WorkshopEnrollmentService } from './workshop-enrollment.service';

// TODO Bloque 3 — Reemplaza esta implementación naive con un DataLoader
//
// Similar a SpeakerLoader pero agrupa conteos de inscripciones por workshopId
// Tipo: DataLoader<string, number>
//
// Pasos:
// 1. Descomenta `import DataLoader from 'dataloader'` arriba
// 2. Declara: loader: DataLoader<string, number>
// 3. En el constructor inicializá:
//      this.loader = new DataLoader(async (ids: readonly string[]) => {
//        const counts = await enrollmentService.countsByWorkshopIds([...ids]);
//        return ids.map((id) => counts.find((c) => c.workshopId === id)?.count ?? 0);
//      });
// 4. En load(): return this.loader.load(workshopId)
//
// IMPORTANTE: la función batch DEBE retornar los resultados en el MISMO orden que los ids
//
// Ver WORKSHOP_GUIDE.md → "Bloque 3 — EnrollmentCountLoader"
@Injectable({ scope: Scope.REQUEST })
export class EnrollmentCountLoader {
  constructor(private readonly enrollmentService: WorkshopEnrollmentService) {}

  load(workshopId: string): Promise<number> {
    // Implementación naive: 1 query por workshop → produce N+1
    // Reemplazá con DataLoader para resolver el problema
    return this.enrollmentService.countByWorkshopId(workshopId);
  }
}
