import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { Speaker } from '../speaker/speaker.entity';
import { SpeakerService } from '../speaker/speaker.service';

// El DataLoader resuelve el problema N+1:
// En lugar de 1 query por speaker, agrupa todos los IDs del mismo tick
// del event loop y ejecuta UNA sola query con IN (...)
//
// Pasos:
// - Usar Scope.REQUEST para que cada petición tenga su propio loader (caché limpio)
// - Función batch: recibe array de speakerIds, retorna Speakers en el MISMO orden
// - Pista: usar SpeakerService.findByIds(), luego mapear al orden de entrada
@Injectable({ scope: Scope.REQUEST })
export class SpeakerLoader {
  loader: DataLoader<string, Speaker>;

  constructor(speakerService: SpeakerService) {
    this.loader = new DataLoader(async (ids: readonly string[]) => {
      const speakers = await speakerService.findByIds([...ids]);
      return ids.map((id) => speakers.find((s) => s.id === id)!);
    });
  }

  load(id: string): Promise<Speaker> {
    return this.loader.load(id);
  }
}
