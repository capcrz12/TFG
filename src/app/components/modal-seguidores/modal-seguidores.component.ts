import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PerfilService } from '../perfil/perfil.service';

@Component({
  selector: 'app-modal-seguidores',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './modal-seguidores.component.html',
  styleUrls: ['./modal-seguidores.component.css']
})
export class ModalSeguidoresComponent implements OnInit {
  @Input() followers: any[] = [];
  @Input() followeds: any[] = [];
  @Input() modalFollowed: boolean = true;
  @Input() title: string = '';  // Título del modal
  @Input() idPerfil: number = -1;
  @Output() close = new EventEmitter<void>();

  constructor (private perfilService: PerfilService) {}

  ngOnInit(): void {
  }

  closeModal() {
    this.close.emit();
  }

  toggleFollow(user: any) {
    user.notFollowing = !user.notFollowing;

    if (!user.notFollowing) {
      this.perfilService.follow(this.idPerfil, user.id_usuario_seguido).subscribe({
        next: () => {
          console.log('Has empezado a seguir al usuario.');
        },
        error: (error) => {
          console.error('Error al seguir al usuario:', error);
        }
      });
    }
    else {
      this.perfilService.unfollow(this.idPerfil, user.id_usuario_seguido).subscribe({
        next: () => {
          console.log('Has dejado de seguir al usuario.');
        },
        error: (error) => {
          console.error('Error al dejar de seguir al usuario:', error);
        }
      });
    }
  }
}
