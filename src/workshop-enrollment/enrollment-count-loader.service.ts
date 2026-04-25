import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { WorkshopEnrollmentService } from './workshop-enrollment.service';

// Similar a SpeakerLoader pero agrupa conteos de inscripciones por workshopId
// Tipo: DataLoader<string, number>
//
// Referencia: ver src/talk/speaker-loader.service.ts
//
// IMPORTANTE: la función batch DEBE retornar los resultados en el mismo
// orden que el array de workshopIds de entrada
@Injectable({ scope: Scope.REQUEST })
export class EnrollmentCountLoader {
  loader: DataLoader<string, number>;

  constructor(enrollmentService: WorkshopEnrollmentService) {
    this.loader = new DataLoader(async (ids: readonly string[]) => {
      const counts = await enrollmentService.countsByWorkshopIds([...ids]);
      return ids.map(
        (id) => counts.find((c) => c.workshopId === id)?.count ?? 0,
      );
    });
  }

  load(workshopId: string): Promise<number> {
    return this.loader.load(workshopId);
  }
}
