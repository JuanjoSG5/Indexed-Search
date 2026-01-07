import { Component } from '@angular/core';
import { SadFace } from '../../icons/sad-face/sad-face';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [SadFace, RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFound {

}
