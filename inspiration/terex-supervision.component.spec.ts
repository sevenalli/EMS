import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerexSupervisionComponent } from './terex-supervision.component';

describe('TerexSupervisionComponent', () => {
  let component: TerexSupervisionComponent;
  let fixture: ComponentFixture<TerexSupervisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerexSupervisionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerexSupervisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
