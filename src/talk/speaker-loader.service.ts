import { Injectable, Scope } from '@nestjs/common';
// import DataLoader from 'dataloader'; // TODO Bloque 3 — Descomenta esta importación
import { Speaker } from '../speaker/speaker.entity';
import { SpeakerService } from '../speaker/speaker.service';

// TODO Bloque 3 — Reemplaza esta implementación naive con un DataLoader
//
// El DataLoader resuelve el problema N+1:
// En lugar de 1 query por speaker, agrupa todos los IDs del mismo tick
// del event loop y ejecuta UNA sola query con IN (...)
//
// Pasos:
// 1. Descomenta `import DataLoader from 'dataloader'` arriba
// 2. Declara: loader: DataLoader<string, Speaker>
// 3. En el constructor inicializá:
//      this.loader = new DataLoader(async (ids: readonly string[]) => {
//        const speakers = await speakerService.findByIds([...ids]);
//        return ids.map((id) => speakers.find((s) => s.id === id)!);
//      });
// 4. En load(): return this.loader.load(id)
//
// IMPORTANTE: Scope.REQUEST crea un loader nuevo por petición (caché limpio)
// IMPORTANTE: la función batch DEBE retornar los resultados en el MISMO orden que los ids
//
// Ver WORKSHOP_GUIDE.md → "Bloque 3 — SpeakerLoader"
@Injectable({ scope: Scope.REQUEST })
export class SpeakerLoader {
  constructor(private readonly speakerService: SpeakerService) {}

  load(id: string): Promise<Speaker> {
    // Implementación naive: 1 query por speaker → produce N+1
    // Reemplazá con DataLoader para resolver el problema
    return this.speakerService.findOneOrFail(id);
  }
}
