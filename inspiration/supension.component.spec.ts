import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupensionComponent } from './supension.component';

describe('SupensionComponent', () => {
  let component: SupensionComponent;
  let fixture: ComponentFixture<SupensionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupensionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupensionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
