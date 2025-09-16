import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SessionService } from '../../services/session.service.js';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SharedModule } from '../../shared.module.js';
import { I18nPipe } from '../../pipes/i18n.pipe.js';

@Component({
  selector: 'app-registerdialog',
  imports: [SharedModule],
  templateUrl: './registerdialog.component.html',
  styleUrl: './registerdialog.component.scss',
})
export class RegisterdialogComponent implements OnInit {
  captchaLink: string = '/api/captcha';
  data = {
    firstname: '',
    lastname: '',
    login: '',
    password: '',
    repassword: '',
    captcha: '',
  };

  constructor(
    public sessionService: SessionService,
    private snackBar: MatSnackBar,
    private router: Router,
    private i18n: I18nPipe,
    public dialogRef: MatDialogRef<any>,
  ) {
    this.reloadCaptcha();
  }

  ngOnInit(): void {}

  reloadCaptcha() {
    this.captchaLink = '/api/captcha?v=' + Date.now();
  }

  formHasError(): boolean {
    return (
      this.data.repassword === undefined ||
      this.data.repassword.length === 0 ||
      this.data.repassword !== this.data.password ||
      this.data.firstname === undefined ||
      this.data.firstname.length === 0 ||
      this.data.lastname === undefined ||
      this.data.lastname.length === 0 ||
      this.data.login === undefined ||
      this.data.login.length === 0 ||
      this.data.captcha === undefined ||
      this.data.captcha.length === 0
    );
  }

  ok(): void {
    if (!this.formHasError()) {
      this.registerAccount(
        this.data.login,
        this.data.password,
        this.data.repassword,
        this.data.firstname,
        this.data.lastname,
        this.data.captcha,
      );
    }
  }

  cancel(): void {
    this.dialogRef.close({ validated: false });
  }

  login(): void {
    this.dialogRef.close({ validated: true, login: true });
  }

  registerAccount(
    login: string,
    password: string,
    repassword: string,
    firstname: string,
    lastname: string,
    captcha: string,
  ) {
    if (
      login.length > 0 &&
      password.length > 0 &&
      repassword.length > 0 &&
      firstname.length > 0 &&
      lastname.length > 0
    ) {
      if (password === repassword) {
        this.sessionService
          .register(firstname, lastname, login, password, captcha)
          .then(
            (data: any) => {
              if (data?.error !== undefined) {
                this.snackBar.open(`Error: ${data.error}`, 'Close', {
                  duration: 3000,
                });
              } else {
                this.snackBar.open(
                  this.i18n.transform('dialog.accountcreated'),
                  'Close',
                  { duration: 3000 },
                );
                this.dialogRef.close({ validated: true, login: true });
              }
            },
            (error: any) => {
              this.snackBar.open(`Error from server`, 'Close', {
                duration: 3000,
              });
            },
          );
      } else {
        this.snackBar.open(`Passwords do not match`, 'Close', {
          duration: 3000,
        });
      }
    } else {
      this.snackBar.open(`Cannot create account, invalid data`, 'Close', {
        duration: 3000,
      });
    }
  }
}
