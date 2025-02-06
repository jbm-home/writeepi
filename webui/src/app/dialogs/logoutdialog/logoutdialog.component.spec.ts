import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoutdialogComponent } from './logoutdialog.component';

describe('LogoutdialogComponent', () => {
  let component: LogoutdialogComponent;
  let fixture: ComponentFixture<LogoutdialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogoutdialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LogoutdialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
