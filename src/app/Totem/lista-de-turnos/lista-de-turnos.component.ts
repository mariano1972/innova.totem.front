import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ApisBackEndService } from '../servicios/apis-back-end.service';
import { Router } from '@angular/router';
import { AlertService, AlertType } from '../servicios/alert.service';
import { NodoHijo } from '../modelos/nodosHijos';
import { Persona } from '../modelos/dni';
import { Turno, Turnos } from '../modelos/turnos';
import { FormControl, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // import

@Component({
  selector: 'app-lista-de-turnos',
  templateUrl: './lista-de-turnos.component.html',
  styleUrls: ['./lista-de-turnos.component.css'],
})
export class ListaDeTurnosComponent implements OnInit, AfterViewInit {
  // Para poder tomar la referencia del elemento hay que implementar AfterViewInit y el método ngAfterViewInit
  @ViewChild('CloseModalToken') CloseModalToken!: ElementRef;
  nodoListaDeTurnos: NodoHijo = new NodoHijo();
  tituloPantalla: string = '';
  persona: Persona = new Persona();
  nombreCompleto: string = '';
  dni: string = '';
  turnos: Turnos = new Turnos();
  turno: Turno = new Turno();
  idCentroDeAtencion: string = '';
  numeros: FormGroup;
  pdfurl: string = '';
  constructor(
    private api: ApisBackEndService,
    private router: Router,
    private alert: AlertService,
    private http: HttpClient,
    private sanitizer: DomSanitizer // private modalservice: NgbModal
  ) {
    this.numeros = new FormGroup({
      token: new FormControl(''),
    });

    const dato_ = sessionStorage.getItem('nodoListaDeTurnos');
    if (dato_) {
      this.nodoListaDeTurnos = JSON.parse(dato_);
      this.tituloPantalla = this.nodoListaDeTurnos._Nombre;
      // console.log('Lista de turnos:', this.nodoListaDeTurnos._Id);
    }
    const datoPersona = sessionStorage.getItem('Persona');
    if (datoPersona) {
      this.persona = JSON.parse(datoPersona);
      this.nombreCompleto =
        this.persona._apellido + ', ' + this.persona._Nombre;
      this.dni = this.persona._Documento._Numero;
    }

    const idCentroDeAtencion = sessionStorage.getItem('idCentroDeAtencion');
    //console.log('idCentroDeAtencion: ' + idCentroDeAtencion);
    if (idCentroDeAtencion) {
      this.idCentroDeAtencion = idCentroDeAtencion;
    }
  }

  // El evento ngAfterViewInit() tiene que estar declarado para poder usar:  @ViewChild('CloseModalToken') CloseModalToken!: ElementRef;
  ngAfterViewInit(): void {}
  ngOnInit(): void {
    this.api
      .getTurnosParaAutorecepcion(this.persona._Id, this.idCentroDeAtencion)
      .subscribe((datos) => {
        if (datos) {
          this.turnos = datos;
          if (this.turnos.Turnos.length == 0) {
            this.tituloPantalla = 'No hay turnos disponibles';
          }
        }
      });
    this.mostrarHora();
  }

  onClickNumero(n: string) {
    const numeroActual = this.numeros.get('token')?.value;
    const nuevoNumero = numeroActual + n;
    this.numeros.controls['token'].setValue(nuevoNumero);
  }

  borrar() {
    const numeroActual = this.numeros.get('token')?.value;
    const nuevoNumero = numeroActual.substring(0, numeroActual.length - 1);
    this.numeros.controls['token'].setValue(nuevoNumero);
  }

  // Se ejecuta por el click en el botón "seleccionar" y deja seteado el turno.
  autorecepcion(index: number) {
    this.turno = this.turnos.Turnos[index];
  }

  aceptar() {
    let token = this.numeros.get('token')?.value;
    if (token == '') {
      this.alert.mostrarAlerta(
        'No se ha ingresado un token.',
        AlertType.Danger,
        4
      );
      return;
    }

    // Cerrar el modal del token.
    let el: HTMLElement = this.CloseModalToken.nativeElement;
    el.click();

    // Disparar proceso de autorecepcion.
    // this.api.getAutorecepcion(this.turno.idTurno, token).subscribe((data) => {
    //   console.log(data);
    //   if (data.Exito) {
    //     console.log(data.ReporteTicketString);
    //   }
    // });
    this.http
      .get('./assets/reportePdf.txt', { responseType: 'text' })
      .subscribe((data) => {
        var blob = new Blob([this._base64ToArrayBuffer(data)], {
          type: 'application/doc',
        });
        this.pdfurl = URL.createObjectURL(blob);
        // this.modalservice.open(this.modalTicketAutorecepcionOk, { size: 'lg' });
        //sessionStorage.setItem('pdfurl', this.pdfurl);
        //this.router.navigate(['visorPdf']);
      });
  }

  _base64ToArrayBuffer(base64: string) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  volver() {
    this.router.navigate(['seleccionDeTramite']);
  }
  hora: any;
  mostrarHora() {
    setInterval(() => {
      this.hora = new Date();
    }, 1000);
  }
}