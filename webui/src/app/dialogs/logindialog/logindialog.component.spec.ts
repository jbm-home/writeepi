import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogindialogComponent } from './logindialog.component';

describe('LogindialogComponent', () => {
  let component: LogindialogComponent;
  let fixture: ComponentFixture<LogindialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogindialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LogindialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
