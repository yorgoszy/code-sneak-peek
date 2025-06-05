
export const getBibliography = (articleId: number, language: string): string => {
  if (articleId === 1) {
    // Lift Heavy bibliography
    if (language === 'el') {
      return `
<div class="text-xs text-gray-600 mt-6">
<strong>Βιβλιογραφία:</strong><br/>
Haff, G. G., & Triplett, N. T. (2015). Essentials of Strength Training and Conditioning. Human Kinetics.<br/>
González-Badillo, J. J., & Sánchez-Medina, L. (2010). Movement velocity as a measure of loading intensity in resistance training. International Journal of Sports Medicine, 31(05), 347-352.<br/>
Izquierdo, M., Häkkinen, K., González-Badillo, J. J., Ibáñez, J., & Gorostiaga, E. M. (2002). Effects of long-term training specificity on maximal strength and power of the upper and lower extremities in athletes from different sports. European Journal of Applied Physiology, 87(3), 264-271.<br/>
Zatsiorsky, V. M., & Kraemer, W. J. (2006). Science and Practice of Strength Training. Human Kinetics.<br/>
García-Ramos, A., & Jaric, S. (2018). Optimization of the load-velocity relationship obtained through linear regression: Comparison of two alternative methods. Journal of Sports Sciences, 36(20), 2405-2412.
</div>`;
    } else {
      return `
<div class="text-xs text-gray-600 mt-6">
<strong>Bibliography:</strong><br/>
Haff, G. G., & Triplett, N. T. (2015). Essentials of Strength Training and Conditioning. Human Kinetics.<br/>
González-Badillo, J. J., & Sánchez-Medina, L. (2010). Movement velocity as a measure of loading intensity in resistance training. International Journal of Sports Medicine, 31(05), 347-352.<br/>
Izquierdo, M., Häkkinen, K., González-Badillo, J. J., Ibáñez, J., & Gorostiaga, E. M. (2002). Effects of long-term training specificity on maximal strength and power of the upper and lower extremities in athletes from different sports. European Journal of Applied Physiology, 87(3), 264-271.<br/>
Zatsiorsky, V. M., & Kraemer, W. J. (2006). Science and Practice of Strength Training. Human Kinetics.<br/>
García-Ramos, A., & Jaric, S. (2018). Optimization of the load-velocity relationship obtained through linear regression: Comparison of two alternative methods. Journal of Sports Sciences, 36(20), 2405-2412.
</div>`;
    }
  } else if (articleId === 2) {
    // Champion born or made bibliography
    if (language === 'el') {
      return `
<div class="text-xs text-gray-600 mt-6">
<strong>Βιβλιογραφία:</strong><br/>
Lieber, R. L. (2010). Skeletal Muscle Structure, Function, and Plasticity. Lippincott Williams & Wilkins.<br/>
Zatsiorsky, V. M., & Kraemer, W. J. (2006). Science and Practice of Strength Training. Human Kinetics.<br/>
Fitts, R. H., & Widrick, J. J. (1996). Muscle mechanics: adaptations with exercise-training. Exercise and Sport Sciences Reviews, 24(1), 427-473.<br/>
Kenney, W. L., Wilmore, J., & Costill, D. (2020). Physiology of Sport and Exercise. Human Kinetics.<br/>
Bergh, U., & Thorstensson, A. (1977). Muscle characteristics in elite athletes. Medicine and Science in Sports, 9(2), 82-86.
</div>`;
    } else {
      return `
<div class="text-xs text-gray-600 mt-6">
<strong>Bibliography:</strong><br/>
Lieber, R. L. (2010). Skeletal Muscle Structure, Function, and Plasticity. Lippincott Williams & Wilkins.<br/>
Zatsiorsky, V. M., & Kraemer, W. J. (2006). Science and Practice of Strength Training. Human Kinetics.<br/>
Fitts, R. H., & Widrick, J. J. (1996). Muscle mechanics: adaptations with exercise-training. Exercise and Sport Sciences Reviews, 24(1), 427-473.<br/>
Kenney, W. L., Wilmore, J., & Costill, D. (2020). Physiology of Sport and Exercise. Human Kinetics.<br/>
Bergh, U., & Thorstensson, A. (1977). Muscle characteristics in elite athletes. Medicine and Science in Sports, 9(2), 82-86.
</div>`;
    }
  } else if (articleId === 3) {
    // Warm-up bibliography
    if (language === 'el') {
      return `
<div class="text-xs text-gray-600 mt-6">
<strong>Βιβλιογραφία:</strong><br/>
Henneman, E., Somjen, G., & Carpenter, D. O. (1965). Excitability and inhibitability of motoneurons of different sizes. Journal of Neurophysiology, 28(3), 599-620.<br/>
Enoka, R. M. (2008). Neuromechanics of Human Movement (4th ed.). Human Kinetics.<br/>
Powers, S. K., & Howley, E. T. (2017). Exercise Physiology: Theory and Application to Fitness and Performance (10th ed.). McGraw-Hill.<br/>
McArdle, W. D., Katch, F. I., & Katch, V. L. (2015). Exercise Physiology: Nutrition, Energy, and Human Performance (8th ed.). Lippincott Williams & Wilkins.<br/>
Behm, D. G., & Chaouachi, A. (2011). A Review of the Acute Effects of Static and Dynamic Stretching on Performance. European Journal of Applied Physiology, 111(11), 2633-2651.
</div>`;
    } else {
      return `
<div class="text-xs text-gray-600 mt-6">
<strong>Bibliography:</strong><br/>
Henneman, E., Somjen, G., & Carpenter, D. O. (1965). Excitability and inhibitability of motoneurons of different sizes. Journal of Neurophysiology, 28(3), 599-620.<br/>
Enoka, R. M. (2008). Neuromechanics of Human Movement (4th ed.). Human Kinetics.<br/>
Powers, S. K., & Howley, E. T. (2017). Exercise Physiology: Theory and Application to Fitness and Performance (10th ed.). McGraw-Hill.<br/>
McArdle, W. D., Katch, F. I., & Katch, V. L. (2015). Exercise Physiology: Nutrition, Energy, and Human Performance (8th ed.). Lippincott Williams & Wilkins.<br/>
Behm, D. G., & Chaouachi, A. (2011). A Review of the Acute Effects of Static and Dynamic Stretching on Performance. European Journal of Applied Physiology, 111(11), 2633-2651.
</div>`;
    }
  }
  return '';
};
