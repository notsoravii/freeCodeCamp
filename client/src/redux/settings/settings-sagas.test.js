import { expectSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { call } from 'redux-saga/effects';
import store from 'store';

import {
  putUpdateMyClassroomMode,
  putUpdateMyExperience,
  putUpdateMyHonesty,
  putUpdateMyKeyboardShortcuts,
  putUpdateMyPortfolio,
  putUpdateMyProfileUI,
  putUpdateMyQuincyEmail,
  putUpdateMySocials,
  putUpdateMySocrates
} from '../../utils/ajax';
import {
  resetMyEditorLayoutError,
  submitProfileUIError,
  updateMyClassroomModeError,
  updateMyExperienceError,
  updateMyHonestyError,
  updateMyKeyboardShortcutsError,
  updateMyPortfolioError,
  updateMyQuincyEmailError,
  updateMySocialsError,
  updateMySocratesError,
  updateMySoundError
} from './actions';
import {
  resetMyEditorLayoutSaga,
  submitProfileUISaga,
  updateMyClassroomModeSaga,
  updateMyExperienceSaga,
  updateMyHonestySaga,
  updateMyKeyboardShortcutsSaga,
  updateMyPortfolioSaga,
  updateMyQuincyEmailSaga,
  updateMySocialsSaga,
  updateMySocratesSaga,
  updateMySoundSaga
} from './settings-sagas';

describe('settings-sagas error handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    store.clearAll();
  });

  const apiErrorCases = [
    {
      name: 'submitProfileUISaga',
      saga: submitProfileUISaga,
      apiFn: putUpdateMyProfileUI,
      errorCreator: submitProfileUIError
    },
    {
      name: 'updateMySocialsSaga',
      saga: updateMySocialsSaga,
      apiFn: putUpdateMySocials,
      errorCreator: updateMySocialsError
    },
    {
      name: 'updateMyKeyboardShortcutsSaga',
      saga: updateMyKeyboardShortcutsSaga,
      apiFn: putUpdateMyKeyboardShortcuts,
      errorCreator: updateMyKeyboardShortcutsError
    },
    {
      name: 'updateMyClassroomModeSaga',
      saga: updateMyClassroomModeSaga,
      apiFn: putUpdateMyClassroomMode,
      errorCreator: updateMyClassroomModeError
    },
    {
      name: 'updateMyHonestySaga',
      saga: updateMyHonestySaga,
      apiFn: putUpdateMyHonesty,
      errorCreator: updateMyHonestyError
    },
    {
      name: 'updateMyQuincyEmailSaga',
      saga: updateMyQuincyEmailSaga,
      apiFn: putUpdateMyQuincyEmail,
      errorCreator: updateMyQuincyEmailError
    },
    {
      name: 'updateMySocratesSaga',
      saga: updateMySocratesSaga,
      apiFn: putUpdateMySocrates,
      errorCreator: updateMySocratesError
    },
    {
      name: 'updateMyPortfolioSaga',
      saga: updateMyPortfolioSaga,
      apiFn: putUpdateMyPortfolio,
      errorCreator: updateMyPortfolioError
    },
    {
      name: 'updateMyExperienceSaga',
      saga: updateMyExperienceSaga,
      apiFn: putUpdateMyExperience,
      errorCreator: updateMyExperienceError
    }
  ];

  it.each(apiErrorCases)(
    '$name dispatches invoked error action on API failure',
    async ({ saga, apiFn, errorCreator }) => {
      const err = new Error('request failed');
      const payload = { test: true };

      const { effects } = await expectSaga(saga, { payload })
        .provide([[call(apiFn, payload), throwError(err)]])
        .run();

      const dispatched = effects.put.map(effect => effect.payload.action);
      expect(dispatched).toEqual([errorCreator(err)]);
    }
  );

  it('updateMySoundSaga dispatches invoked updateMySoundError action when storage throws', async () => {
    const err = new Error('storage failed');
    vi.spyOn(store, 'set').mockImplementation(() => {
      throw err;
    });

    const { effects } = await expectSaga(updateMySoundSaga, {
      payload: { sound: true }
    }).run();

    const dispatched = effects.put.map(effect => effect.payload.action);
    expect(dispatched).toEqual([updateMySoundError(err)]);
  });

  it('resetMyEditorLayoutSaga dispatches invoked resetMyEditorLayoutError action when storage throws', async () => {
    const err = new Error('remove failed');
    store.set('challenge-layout', { some: 'layout' });
    vi.spyOn(store, 'remove').mockImplementation(() => {
      throw err;
    });

    const { effects } = await expectSaga(resetMyEditorLayoutSaga).run();

    const dispatched = effects.put.map(effect => effect.payload.action);
    expect(dispatched).toEqual([resetMyEditorLayoutError(err)]);
  });
});
