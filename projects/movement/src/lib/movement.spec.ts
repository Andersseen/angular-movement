import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Movement } from './movement';

describe('Movement', () => {
  let component: Movement;
  let fixture: ComponentFixture<Movement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Movement],
    }).compileComponents();

    fixture = TestBed.createComponent(Movement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
