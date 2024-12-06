import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloaddialogComponent } from './downloaddialog.component';

describe('DownloaddialogComponent', () => {
  let component: DownloaddialogComponent;
  let fixture: ComponentFixture<DownloaddialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DownloaddialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DownloaddialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
